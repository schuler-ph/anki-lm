import { Link } from "react-router-dom";

function FooterColumn(
  props: { title: string; items: { title: string; link: string }[] },
) {
  return (
    <div className="flex flex-col">
      <span className="font-semibold mb-4">{props.title}</span>
      {props.items.map((item, index) => (
        <Link
          to={item.link}
          key={index}
          className="mb-2 hover:underline transition-all cursor-pointer font-light"
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}

export default FooterColumn;
