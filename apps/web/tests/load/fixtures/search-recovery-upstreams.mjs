import "./isolate-upstreams.mjs";

const isolatedFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL
      ? String(input)
      : input.url,
  );
  if (url.hostname === "api.deezer.com") {
    if (url.pathname === "/artist/909090") {
      return Promise.resolve(
        Response.json({
          id: 909090,
          name: "Slowdive",
          picture: null,
          link: "https://www.deezer.com/artist/909090",
          nb_album: 0,
          nb_fan: 0,
        }),
      );
    }
    return Promise.resolve(Response.json({ data: [] }));
  }
  return isolatedFetch(input, init);
};
