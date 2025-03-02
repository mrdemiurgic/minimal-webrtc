defmodule MinimalWebrtcWeb.Router do
  use MinimalWebrtcWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {MinimalWebrtcWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  scope "/", MinimalWebrtcWeb do
    pipe_through :browser
    get "/", PageController, :home

    live "/:room", RoomLive
  end
end
