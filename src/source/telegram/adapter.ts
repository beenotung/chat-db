import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { saveSessionText } from "./auth";
import qrcode from "qrcode-terminal";

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
              const encoded = code.token
                .toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");
              const url = `tg://login?token=${encoded}`;
              qrcode.generate(url, { small: true });
            },
            onError: async (err) => {
              console.error(err);
              // process.exit(1)
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
        // console.log("Session string:", client.session.save());
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
    } catch (error) {
      reject(error);
      return;
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

  return { client, ready, getTel, events, getAuthState };
}
