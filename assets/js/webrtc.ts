/**
 * WebRTC Negotiation Process Explained
 *
 * WebRTC enables direct peer-to-peer video/audio communication between browsers.
 * Here's how the negotiation process works:
 *
 * 1. Initial Setup:
 *    - Both peers create RTCPeerConnection objects
 *    - Each peer gets access to their local webcam
 *    - We use STUN servers to help peers find each other across the internet
 *
 * 2. Signaling Process (done through our Phoenix server):
 *    a) Peer A enters the room
 *       - Broadcasts "ready" message
 *    b) Peer B enters the room
 *       - Broadcasts "ready" message
 *       - Peer A receives "enter" event and creates an "offer"
 *    c) Offer/Answer Exchange:
 *       - Peer A sends SDP offer (contains video/audio capabilities)
 *       - Peer B receives offer, creates and sends back SDP answer
 *       - Both peers now know each other's media capabilities
 *
 * 3. ICE Candidate Exchange:
 *    - Both peers discover their network connectivity options
 *    - Each peer sends their ICE candidates to the other
 *    - ICE candidates are like possible paths for connection
 *      (local network, through STUN server, etc.)
 *
 * 4. Connection Establishment:
 *    - Once compatible ICE candidates are found
 *    - Direct peer-to-peer connection is established
 *    - Video/audio starts flowing directly between peers
 */

const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:5349" },
    { urls: "stun:stun1.l.google.com:3478" },
    { urls: "stun:stun1.l.google.com:5349" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:5349" },
    { urls: "stun:stun3.l.google.com:3478" },
    { urls: "stun:stun3.l.google.com:5349" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:5349" },
  ],
};

/**
 * Hook for the local video element
 *
 * Simply displays your own webcam feed locally
 */
export const LocalVideo = {
  async mounted() {
    const localStream = await createLocalStream();
    this.el.srcObject = localStream;
  },
};

/**
 * Hook for the remote video element
 *
 * Handles all WebRTC peer connection logic
 */
export const RemoteVideo = {
  async mounted() {
    // Create the WebRTC peer connection
    const peer = new RTCPeerConnection(iceConfig);

    // Get local webcam stream and add each track to the peer connection
    // This makes our video available to send to the other peer
    const localStream = await createLocalStream();
    for (const track of localStream.getTracks()) {
      peer.addTrack(track, localStream);
    }

    // When we receive video/audio tracks from the other peer,
    // attach them to the video element to display them
    peer.ontrack = (e) => {
      console.log("Received remote video/audio tracks");
      this.el.srcObject = e.streams[0];
    };

    // When we discover a new ICE candidate (a potential connection path),
    // send it to the other peer through Phoenix
    peer.onicecandidate = ({ candidate }) => {
      console.log("Found new ICE candidate, sending to other peer");
      this.pushEvent("candidate", candidate ?? {});
    };

    // When we receive an ICE candidate from the other peer,
    // add it to our peer connection as a potential path
    this.handleEvent("candidate", (candidate) => {
      console.log("received a candidate", candidate);
      peer.addIceCandidate(candidate);
    });

    // When a new peer enters the room, we create and send an offer
    // The offer contains our video/audio capabilities
    this.handleEvent("enter", async () => {
      console.log("New peer entered, creating offer");
      const offer = await peer.createOffer();

      // We must set our local description before sending the offer
      await peer.setLocalDescription(offer);

      console.log("Sending offer to new peer");
      this.pushEvent("offer", offer);
    });

    // When we receive an offer from another peer:
    // 1. Set it as remote description (their capabilities)
    // 2. Create an answer with our capabilities
    // 3. Set our local description
    // 4. Send the answer back
    this.handleEvent("offer", async (offer) => {
      console.log("Received offer from other peer");
      await peer.setRemoteDescription(offer);

      console.log("Creating answer with our capabilities");
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      console.log("Sending answer back to peer");
      this.pushEvent("answer", answer);
    });

    // When we receive an answer to our offer:
    // Set it as remote description (their capabilities)
    // At this point, both peers know each other's capabilities
    // and ICE candidate exchange can begin
    this.handleEvent("answer", async (answer) => {
      console.log("Received answer, setting peer capabilities");
      await peer.setRemoteDescription(answer);
    });

    this.handleEvent("leave", () => {
      this.el.srcObject = undefined;
    });

    console.log("sending out enter");
    this.pushEvent("enter", {});
  },
};

/**
 * Helper function to access the user's webcam
 * Returns a MediaStream object containing video track
 * facingMode: "user" means we want the front-facing camera
 */
const createLocalStream = async () => {
  const localStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
  });

  return (function () {
    return localStream;
  })();
};
