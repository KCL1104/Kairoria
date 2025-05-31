export function MapView() {
  return (
    <div className="relative w-full h-[calc(80vh-140px)] rounded-md overflow-hidden border">
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">
          Map component would load here with markers for all available products.
          <br />
          In a production app, this would integrate with Google Maps or Mapbox.
        </p>
      </div>
    </div>
  )
}