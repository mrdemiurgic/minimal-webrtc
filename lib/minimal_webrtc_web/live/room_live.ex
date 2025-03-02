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

  # This handles any events received from websocket. It is simply passed on to the next
  def handle_event(event, payload, %{assigns: %{room: room}} = socket) do
    PubSub.broadcast_from(
      MinimalWebrtc.PubSub,
      self(),
      room,
      {event, payload}
    )

    {:noreply, socket}
  end

  @impl true
  def handle_info({event, payload} = a, socket) do
    IO.inspect(a)
    {:noreply, push_event(socket, event, payload)}
  end

  @impl true
  def terminate(_reason, %{assigns: %{room: room}} = socket) do
    PubSub.broadcast_from(MinimalWebrtc.PubSub, self(), room, {:leave, %{}})
    {:noreply, socket}
  end
end
