export function PageSection({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="stack" style={{ gap: 18 }}>
      <div className="page-header">
        <span className="badge">{title}</span>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
