import { ColumnDef } from "@tanstack/react-table";


// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
type Song = {
  id: string
  title: string
  album: string
  duration: string,
}

export const columns: (onPlaySong: (id: string) => void) => ColumnDef<Song>[] = (playSong) => {
  return [
    {
      accessorKey: 'id',
      header: '#',
      cell: ({ row }) => {
        return <div>
            <span className="group-hover:hidden">{row.getValue('id')}</span>
            <span className="hidden group-hover:block" onClick={() => playSong(row.getValue('id'))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-play" viewBox="0 0 16 16">
                <path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/>
              </svg>
            </span>
          </div>;
      }
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "album",
      header: "Album",
    },
    {
      accessorKey: "duration",
      header: "Duration",
    },
  ];
}
