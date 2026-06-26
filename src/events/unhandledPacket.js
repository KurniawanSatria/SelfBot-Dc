import { PreloadedUserSettings } from "discord-protos";

export default function unhandledPacket(client, packet) {
  if (typeof packet.t !== "string") return;

  if (packet.t === "USER_SETTINGS_PROTO_UPDATE") {
    if (packet.d.settings.type === 1) {
      const decoded = PreloadedUserSettings.fromBase64(packet.d.settings.proto);
      client.user.setStatus(decoded.status.status.value);
    }
  }
}
