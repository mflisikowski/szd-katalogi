export const mediaTranslations = {
  duplicateGuard: {
    banner: 'Plik „{{title}}” już istnieje w tym katalogu. Zapis nowej wersji zostanie zablokowany.',
    deleteButton: 'Usuń istniejący plik',
    deleteError: 'Nie udało się usunąć pliku. Spróbuj ponownie lub usuń go z listy multimediów.',
    deleteSuccess: 'Usunięto stary plik „{{title}}”. Możesz teraz zapisać nową wersję.',
    modalBody: 'Trwale usunąć plik „{{title}}” z tego katalogu? Tej operacji nie można cofnąć.',
    modalCancel: 'Anuluj',
    modalConfirm: 'Usuń teraz',
    modalHeading: 'Usuwanie istniejącego pliku',
  },
  errors: {
    duplicateTitle: 'Plik „{{title}}” już istnieje w tym katalogu — usuń go, jeśli chcesz wgrać nowszą wersję.',
  },
  fields: {
    catalog: 'Katalog',
    categories: {
      description: 'Tworzone automatycznie z nawiasu kwadratowego w nazwie pliku — wspólne dla całego katalogu',
      label: 'Kategorie',
    },
    letter: {
      description: 'Litera filtru alfabetycznego, wyliczana z tytułu',
      label: 'Litera',
    },
    slug: {
      description: 'Generowany z tytułu, jeśli pole pozostanie puste',
      label: 'Przyjazny URL',
    },
    title: {
      description: 'Pozostaw puste — tytuł zostanie wyliczony z nazwy pliku PDF przy zapisie',
      label: 'Tytuł',
    },
  },
  plural: 'Multimedia',
  singular: 'Plik multimedialny',
} as const
