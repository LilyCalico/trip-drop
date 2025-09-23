const Label = ({ id, text }: { id: string; text: string }) => {
  return (
    <label className="text-[1.4rem]" htmlFor={id}>
      {text}
    </label>
  );
};

export default Label;
