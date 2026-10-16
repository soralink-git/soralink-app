export default function CardBackground({ src, opacity }: { src: string; opacity: number }) {
  return src ? (
    <img
      className="card-background-photo"
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ opacity: opacity / 100 }}
    />
  ) : null;
}
