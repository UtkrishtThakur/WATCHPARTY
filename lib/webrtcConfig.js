export async function getIceServers() {
  try {
    const res = await fetch("/api/turn");
    const data = await res.json();

    if (data?.iceServers) {
      console.log("Using Metered TURN:", data.iceServers);
      return data.iceServers;
    }
  } catch (err) {
    console.error("TURN fetch failed, fallback STUN:", err);
  }

  return [{ urls: "stun:stun.l.google.com:19302" }];
}
