import { SignOut } from "./_components/sign-out";

export default function Home() {
  return (
    <h1 className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold underline text-red-500">
          This is a protected route
        </h1>
        <SignOut />
      </div>
    </h1>
  );
}
