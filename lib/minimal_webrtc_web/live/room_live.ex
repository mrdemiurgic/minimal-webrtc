defmodule MinimalWebrtcWeb.RoomLive do
  alias Phoenix.PubSub
  use Phoenix.LiveView

  @impl true
  @spec mount(map(), any(), Phoenix.LiveView.Socket.t()) :: {:ok, map()}
  def mount(%{"room" => room} = _params, _session, socket) do
    if connected?(socket) do
      PubSub.subscribe(MinimalWebrtc.PubSub, room)
    end

    {:ok, socket |> assign(:room, room)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="flex flex-row gap-12 items-center justify-center w-screen h-screen font-bold text-xl">
      <div class="flex flex-col items-center">
        Local Video
        <video
          id="local_video"
          autoplay="true"
          phx-hook="LocalVideo"
          class="w-[600px] h-[400px] bg-black"
        />
      </div>
      <div class="flex flex-col items-center">
        Remote Video
        <video
          id="remote_video"
          autoplay="true"
          phx-hook="RemoteVideo"
          class="w-[600px] h-[400px] bg-black"
        />
      </div>
    </div>
    """
  end

  @doc """
  Handles WebRTC signaling events from the client (browser).
  Broadcasts the event to all other clients in the same room, excluding the sender.

  Expected events include:
  - "enter" - When a new peer joins a room, it notifies others that it is ready
  - "offer" - When a peer creates and sends an SDP offer
  - "answer" - When a peer responds with an SDP answer
  - "ice_candidate" - When a peer discovers new ICE candidates
  - "leave" - When a peer leaves the room (closes the browser tab)
  """
  @impl true
  def handle_event(event, payload, %{assigns: %{room: room}} = socket) do
    PubSub.broadcast_from(
      MinimalWebrtc.PubSub,
      self(),
      room,
      {event, payload}
    )

    {:noreply, socket}
  end

  @doc """
  Handles incoming PubSub messages from the other peer in the room.
  Forwards the received WebRTC signaling messages to the client's browser
  via push_event.

  Messages can be:
  - {"ender", %{}} - Notification that the other peer is ready to accept a new offer sdp
  - {"offer", sdp_data} - Incoming offer from the other peer
  - {"answer", sdp_data} - Incoming answer from the other peer
  - {"ice_candidate", candidate_data} - Incoming ICE candidate from the other peer
  - {"leave", %{}} - Notification that the connected peer has left the room
  """
  @impl true
  def handle_info({event, payload} = a, socket) do
    # Print all events with payloads for learning/debugging purposes
    IO.inspect(a)
    {:noreply, push_event(socket, event, payload)}
  end

  @impl true
  @doc """
  Called when a user leaves the room (closes browser, navigates away, etc.)
  Broadcasts a "leave" event to the other peer in the room so they can clean up
  their WebRTC connections appropriately.
  """
  def terminate(_reason, %{assigns: %{room: room}} = socket) do
    PubSub.broadcast_from(MinimalWebrtc.PubSub, self(), room, {:leave, %{}})
    {:noreply, socket}
  end
end
