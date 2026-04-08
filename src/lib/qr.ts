import QRCode from "qrcode";
import { TeamStatus } from "@/lib/domain";

export type TeamQrPayload = {
  teamId: string;
  teamName: string;
  status: TeamStatus;
  token: string;
  eventEligibility: boolean;
};

export function buildTeamQrPayload(team: { id: string; name: string; status: TeamStatus; qrToken: string | null }) {
  const token = team.qrToken ?? "";
  const payload: TeamQrPayload = {
    teamId: team.id,
    teamName: team.name,
    status: team.status,
    token,
    eventEligibility: team.status === TeamStatus.APPROVED && Boolean(token),
  };
  return JSON.stringify(payload);
}

export async function buildTeamQrCodeUrl(team: { id: string; name: string; status: TeamStatus; qrToken: string | null }) {
  const payload = buildTeamQrPayload(team);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
    color: {
      dark: "#17324d",
      light: "#ffffff",
    },
  });
}
