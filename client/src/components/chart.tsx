export default function Chart({ window }: { window: number[] }) {
  return (
    <div>
      {window.map((state, index) => {
        if (state === 0) {
          return <div key={index} className="bg-red-500 h-5 w-1" />;
        } else if (state === 1) {
          return <div key={index} className="bg-green-500 h-5 w-1" />;
        } else {
          return <div key={index} className="bg-gray-500 h-5 w-1" />;
        }
      })}
    </div>
  );
}
