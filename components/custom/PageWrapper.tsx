export default function PageWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="p-[2.4rem]">{children}</div>;
}
