export default function AuthWrapper({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="w-[70vw] max-w-[40rem] mx-auto mt-[12rem]">
      <h1 className="text-font-primary font-semibold mb-[5.6rem] text-[1.8rem] text-center">
        {title}
      </h1>
      {children}
    </div>
  );
}
