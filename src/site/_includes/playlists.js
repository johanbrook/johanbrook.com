const fetchPlaylists = () => fetch('/playlists.json').then((res) => res.json());

const template = (playlist) =>
  `<div>
    ${playlist.name}
  </div>
`;

function init() {
  const rootElement = document.getElementById('playlists');

  fetchPlaylists()
    .then((playlists) => {
      const html = playlists.map((list) => template(list));

      rootElement.innerHTML = html;
    })
    .catch((err) => console.error(err));
}

document.addEventListener('DOMContentLoaded', init, false);
