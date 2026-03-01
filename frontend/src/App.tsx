import AppBar from "./components/AppBar";

function App() {
  return (
    <div id="App" className="dark h-screen flex flex-col bg-background text-foreground">
      <AppBar title="scrcpy-gui" />
      <main className="flex-1 grid place-items-center p-6">
        <h1 className="text-4xl text-center">Hello</h1>
      </main>
    </div>
  );
}

export default App;
