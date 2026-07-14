import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { EventEmitter } from "events";
import { saveSessionText } from "./auth";
import qrcode from "qrcode-terminal";

export type ClientEventMap = {
  ready: []
  qr: [qr: string]
  disconnected: [reason: string]
  authenticated: []
  auth_failure: [message: string]
}

export type AuthState = 'loading' | 'authenticated' | 'not_authenticated'

export type TelegramConfig = {
  session_dir: string;
  apiId: number;
  apiHash: string;
  connectionRetries?: number;
  session_text?: string;
};

export function getClient(options: TelegramConfig) {
  let session = new StringSession(options.session_text || "");
  let client = new TelegramClient(session, options.apiId, options.apiHash, {
    connectionRetries: options.connectionRetries ?? 5,
  });

  let events = new EventEmitter<ClientEventMap>()
  let authState: AuthState = 'loading'

  let ready = new Promise<void>(async (resolve, reject) => {
    try {
      console.log("connecting to telegram...");
      let timeout = setTimeout(() => {
        reject(
          "telegram connection timeout. session expired? please clear the session.txt and retry",
        );
      }, 10 * 1000);
      await client.connect();
      clearTimeout(timeout);
      console.log("connected to telegram");

      if (!options.session_text) {
        await client.signInUserWithQrCode(
          { apiId: options.apiId, apiHash: options.apiHash },
          {
            qrCode: async (code) => {
              authState = 'not_authenticated'
              const encoded = code.token
                .toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");
              const url = `tg://login?token=${encoded}`;
              events.emit('qr', url)
              qrcode.generate(url, { small: true });
            },
            onError: async (err) => {
              console.error(err);
              return true;
            },
          },
        );
        let profile = await client.getMe();
        if (profile.username) {
          console.log("login telegram as username: " + profile.username);
        } else if (profile.phone) {
          console.log("login telegram as tel: " + profile.phone);
        } else {
          console.log("login telegram successfully");
        }
        let session_text = client.session.save();
        if (typeof session_text !== "string") {
          throw new Error("failed to get session text");
        }
        saveSessionText({ session_dir: options.session_dir, session_text });
      } else {
        console.log("resume telegram session");
        let profile = await client.getMe();
        if (profile.username) {
          console.log("login telegram as username: " + profile.username);
        } else if (profile.phone) {
          console.log("login telegram as tel: " + profile.phone);
        } else {
          console.log("login telegram successfully");
        }
      }
      authState = 'authenticated'
      events.emit('authenticated')
      events.emit('ready')
      resolve()
    } catch (error) {
      authState = 'not_authenticated'
      events.emit('auth_failure', String(error))
      reject(error);
    }
  });

  async function getTel() {
    let profile = await client.getMe();
    let tel = profile.phone;
    if (tel) {
      return "+" + tel;
    }
    return null;
  }

  function getAuthState() {
    return authState
  }

  return { client, ready, events, getTel, getAuthState };
}
