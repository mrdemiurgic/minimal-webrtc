import Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :minimal_webrtc, MinimalWebrtcWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "sWkx2XMhJRU7m+JPIC+ij4DtfnPOODJghA3lX7zB/rBATisUPs4n5S07RQ2K0gU4",
  server: false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime

# Enable helpful, but potentially expensive runtime checks
config :phoenix_live_view,
  enable_expensive_runtime_checks: true
