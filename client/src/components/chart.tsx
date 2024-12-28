export default function Chart({
  window,
  healthy,
}: {
  window: number[];
  healthy: boolean;
}) {
  return (
    <main className="flex flex-col gap-1">
      <div className="flex gap-[0.1rem]">
        {window.map((state, index) => {
          if (state === 0) {
            return <div key={index} className="bg-red-500 h-10 w-[0.2rem]" />;
          } else if (state === 1) {
            return <div key={index} className="bg-green-500 h-10 w-[0.2rem]" />;
          } else {
            return <div key={index} className="bg-gray-500 h-10 w-[0.2rem]" />;
          }
        })}
      </div>
      <div className="flex justify-between w-full text-xs">
        <span className="flex gap-2 items-center">
          <div
            className={`${
              healthy
                ? `shadow-[0px_0px_3px_1px_rgba(0,249,0,1)]`
                : `shadow-[0px_0px_3px_1px_rgba(255,38,0,1)]`
            }  animate-pulse  rounded-full`}
          >
            <div
              className={`${
                healthy ? `bg-green-500` : `bg-red-500`
              } w-1 h-1 rounded-full`}
            ></div>
          </div>
          <p>{healthy ? "Healthy" : "Unhealthy"}</p>
        </span>
        <p>Queue size: N</p>
      </div>
    </main>
  );
}
