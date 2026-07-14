import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import { createInterface } from "node:readline/promises";
import qrcode from "qrcode-terminal";
import { env } from "../../env";
import { getSessionText, saveSessionText } from "./auth";

async function test_telegram() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const apiId = env.TG_API_ID;
  const apiHash = env.TG_API_HASH;
  let session_string = getSessionText({ session_dir: env.TG_SESSION_DIR });
  const session = new StringSession(session_string || "");

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  console.log("connecting to telegram...");
  let timeout = setTimeout(() => {
    console.error(
      "telegram connection timeout. session expired? please clear the session.txt and retry",
    );
    process.exit(1);
  }, 10 * 1000);
  await client.connect();
  clearTimeout(timeout);
  console.log("connected to telegram");

  if (!session_string) {
    await client.signInUserWithQrCode(
      { apiId, apiHash },
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
    saveSessionText({ session_dir: env.TG_SESSION_DIR, session_text });
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

  await client.sendMessage("me", { message: "hello from teleproto" });

  rl.close();
}

test_telegram().catch((error) => {
  console.error(error);
  process.exit(1);
});
