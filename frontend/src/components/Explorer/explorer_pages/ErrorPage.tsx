import { useExplorer } from "../ExplorerContext.tsx";

interface Props {
  heading: string;
  message: string;
  hint?: string;
}

export function ErrorPage({ heading, message, hint }: Props) {
  const { navigate } = useExplorer();

  return (
    <div>
      <h1>{heading}</h1>
      <hr />
      <div>
        <p>{message}</p>
        <ul>
          {hint && <li>{hint}</li>}
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate({ page: "home" });
              }}
            >
              Go to the home page
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}