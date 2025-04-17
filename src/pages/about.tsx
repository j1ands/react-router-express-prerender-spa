import type { Route } from "./+types/about";

export async function loader({ request, params }: Route.LoaderArgs) {
  console.log("loader", request, params);
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
