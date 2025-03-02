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
 *       - Broadcasts "enter" message
 *    b) Peer B enters the room
 *       - Broadcasts "enter" message
 *       - Peer A receives "enter" event and creates an "offer"
 *    c) Offer/Answer Exchange:
 *       - Peer A sends SDP offer (contains video/audio capabilities)
 *       - Peer B receives offer, creates and sends back SDP answer
 *       - Both peers now know each other's media capabilities
 *
 * 3. ICE Candidate Exchange:
 *    - Both peers discover their network connectivity options
 *    - Each peer sends their ICE candidates to the other
 *    - ICE candidates are possible paths for connection
 *      (local network, through a UDP port punched into NAT from the outside, through a TURN server, etc.)
 *
 * 4. Connection Establishment:
 *    Once compatible ICE candidates are found,
 *    direct peer-to-peer connection is established.
 *    Video/audio starts flowing directly between peers.
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
    // Create the WebRTC peer connection instance.
    // ICE configuration is set here
    const peer = new RTCPeerConnection(iceConfig);

    // When we receive video/audio tracks from the other peer,
    // attach them to the video element to display them
    peer.ontrack = (e) => {
      console.log("Received remote video/audio tracks");
      this.el.srcObject = e.streams[0];
    };

    // When we discover a new ICE candidate (a potential connection path),
    // send it to the other peer through Phoenix
    //
    // A RTCPeerConnection is triggered to start generating ICE candidates
    // after an offer or answer sdp is created and set as the local description.
    //
    // See the "enter", "offer", and "answer" event handlers below
    peer.onicecandidate = ({ candidate }) => {
      console.log("Generated a new ICE candidate:", candidate);
      this.pushEvent("candidate", candidate ?? {});
    };

    // When we receive an ICE candidate from the other peer,
    // add it to our peer connection as a potential connection path
    this.handleEvent("candidate", (candidate) => {
      console.log("Received an ICE candidate", candidate);
      peer.addIceCandidate(candidate);
    });

    // When a new peer enters the room and is ready to connect,
    // we create and send an offer.
    //
    // The offer description (sdp) contains our video/audio capabilities
    this.handleEvent("enter", async () => {
      console.log("A new peer joined and is requesting an offer sdp");
      const offer = await peer.createOffer();

      // We must set our local description before sending the offer
      await peer.setLocalDescription(offer);

      this.pushEvent("offer", offer);
    });

    // When we receive an offer from another peer,
    // add it to our RTCPeerConnection instance.
    //
    // In response, generate an answer sdp and relay it back.
    this.handleEvent("offer", async (offer) => {
      console.log("Received an offer from the other peer:", offer);

      await peer.setRemoteDescription(offer);

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      this.pushEvent("answer", answer);
    });

    // When we receive an answer to our offer, add it into RTCPeerConnection.
    //
    // At this point, both peers know each other's capabilities
    // such as which video and audio codecs can be used with each other.
    this.handleEvent("answer", async (answer) => {
      console.log("Received answer, setting peer capabilities");
      await peer.setRemoteDescription(answer);
    });

    this.handleEvent("leave", () => {
      this.el.srcObject = undefined;
    });

    // After all event listeners are set up, we are ready to add
    // the local webcam video stream tracks to RTCPeerConnection.
    //
    // This action triggers the negotiationneeded event. Some webrtc
    // engine implementations rely on this event to know when to create
    // the offer sdp.
    //
    // To keep it simple, we will send out the "enter" event to manually
    // trigger the other end to create an offer sdp
    //
    // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/negotiationneeded_event
    const localStream = await createLocalStream();
    for (const track of localStream.getTracks()) {
      peer.addTrack(track, localStream);
    }

    this.pushEvent("enter", {});
  },
};

/**
 * Helper function to access the user's webcam
 * Returns a MediaStream object containing video track
 *
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
