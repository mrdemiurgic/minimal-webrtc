# MinimalWebrtc

A minimal WebRTC video chat implementation using Phoenix LiveView and TypeScript.

## Key Files

This project demonstrates peer-to-peer video chat using WebRTC. The two main files that handle the WebRTC logic are:

### lib/minimal_webrtc_web/live/room_live.ex
This Phoenix LiveView file handles the server-side coordination between peers:
- Creates a video chat room with a unique ID
- Manages WebSocket connections for peers in the same room
- Relays WebRTC negotiation messages between peers
- Handles peers joining and leaving the room

### assets/js/webrtc.ts
This TypeScript file contains all the WebRTC peer connection logic:
- Sets up local and remote video streams
- Handles the WebRTC negotiation process
- Creates and manages peer connections
- Exchanges connection information between peers
- Contains detailed documentation explaining the WebRTC process

## Getting Started

To start your Phoenix server:

  * Run `mix setup` to install and setup dependencies
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000/room/test`](http://localhost:4000/room/test) from two different browser windows to test the video chat.

## How It Works

1. Open the room URL in two different browsers
2. Each browser:
   - Gets access to your webcam
   - Creates a WebRTC peer connection
   - Connects to the Phoenix server via WebSocket
3. The browsers exchange connection info through the Phoenix server
4. Once connected, video streams directly between browsers (peer-to-peer)
5. The Phoenix server only helps with the initial connection setup

## Learn More About the Technologies

  * WebRTC: https://webrtc.org/
  * Phoenix LiveView: https://hexdocs.pm/phoenix_live_view
  * Phoenix Framework: https://www.phoenixframework.org/
