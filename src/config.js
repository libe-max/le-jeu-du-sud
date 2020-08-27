const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'

const config = {
  meta: {
    author: 'Libé Labo',
    title: 'On dirait le sud',
    url: 'https://www.liberation.fr/apps/2020/09/on-dirait-le-sud/',
    description: 'Nous avons sélectionné dix villes parmi les plus peuplées de France. Placez-les au nord ou au sud selon l\'image que vous en avez pour nous permettre de mesurer le décalage entre les faits et votre perception.',
    image: '',
    xiti_id: 'on-dirait-le-sud',
    tweet: '',
  },
  tracking: {
    active: false,
    format: 'libe-apps-template',
    article: 'libe-apps-template'
  },
  show_header: true,
  statics_url: process.env.NODE_ENV === 'production'
    ? 'https://www.liberation.fr/apps/static'
    : `${currentProtocol}//${currentHostname}:3003`,
  api_url: process.env.NODE_ENV === 'production'
    ? 'https://libe-labo-2.site/api'
    : `${currentProtocol}//${currentHostname}:3004/api`,
  stylesheet: 'libe-apps-template.css',
  spreadsheet: undefined
}

module.exports = config
