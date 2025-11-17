export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="p-[2.4rem] max-w-[66rem] mx-auto px-[3rem]">{children}</div>
  );
}
