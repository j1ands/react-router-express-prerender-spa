import type { Route } from "./+types/about";

// { request, params }: Route.LoaderArgs
export async function loader() {
  const post = {
    title: "Hellos",
  };
  return post;
}

export default function About({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.title}</div>;
}


// export default function About() {
//   return (
//     <div>
//       <h1>Look ma!</h1>
//       <p>
//         I'm still using React Router after like 10 years.
//       </p>
//     </div>
//   );
// }
