import Button from "../Button";

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function Popover(
  { lid, type, Content }: {
    lid: number;
    type: string;
    Content: React.ComponentType<unknown>;
  },
) {
  return (
    <>
      <Button
        name={capitalizeFirstLetter(type)}
        popoverTarget={`popover-${type}-${lid}`}
        popoverTargetAction="show"
      />
      <div
        id={`popover-${type}-${lid}`}
        popover="auto"
        className="fixed inset-0 mx-auto mt-5 h-full overscroll-contain bg-white p-4 shadow-xl rounded-lg border-none"
      >
        <article className="prose pb-10">
          <Content />
        </article>
      </div>
    </>
  );
}

export default Popover;
