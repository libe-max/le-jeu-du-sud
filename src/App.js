import React, { Component } from 'react'
import Loader from 'libe-components/lib/blocks/Loader'
import LoadingError from 'libe-components/lib/blocks/LoadingError'
import ShareArticle from 'libe-components/lib/blocks/ShareArticle'
import LibeLaboLogo from 'libe-components/lib/blocks/LibeLaboLogo'
import ArticleMeta from 'libe-components/lib/blocks/ArticleMeta'
import PageTitle from 'libe-components/lib/text-levels/PageTitle'
import Overhead from 'libe-components/lib/text-levels/Overhead'
import Paragraph from 'libe-components/lib/text-levels/Paragraph'
import Gauge from './components/Gauge'
import FranceMap from './components/FranceMap'

const serverUrl = process.env.NODE_ENV === 'production'
  ? 'https://proxydata.liberation.fr/contributions/le-jeu-du-sud'
  : 'http://localhost:3004/contributions/le-jeu-du-sud'

export default class App extends Component {
  /* * * * * * * * * * * * * * * * *
   *
   * CONSTRUCTOR
   *
   * * * * * * * * * * * * * * * * */
  constructor () {
    super()
    this.c = 'le-jeu-du-sud'
    this.state = {
      loading_sheet: true,
      error_sheet: null,
      data_sheet: [],

      mode: 'intro',

      loading_cities: false,
      error_cities: null,
      data_cities: [],
      current_city_nb: 0,

      pending_votes: [],

      loading_results: false,
      error_results: null,
      data_results: [],

      data_votes_cnt: 0,

      keystrokes_history: [],
      konami_mode: false
    }
    this.fetchSheet = this.fetchSheet.bind(this)
    this.fetchCredentials = this.fetchCredentials.bind(this)
    this.listenToKeyStrokes = this.listenToKeyStrokes.bind(this)
    this.watchKonamiCode = this.watchKonamiCode.bind(this)
    this.handleActivateGameMode = this.handleActivateGameMode.bind(this)
    this.handleVote = this.handleVote.bind(this)
    this.handleActivateResultsGaugeMode = this.handleActivateResultsGaugeMode.bind(this)
    this.handleActivateResultsMapMode = this.handleActivateResultsMapMode.bind(this)
  }

  /* * * * * * * * * * * * * * * * *
   *
   * DID MOUNT
   *
   * * * * * * * * * * * * * * * * */
  componentDidMount () {
    document.addEventListener('keydown', this.listenToKeyStrokes)
    // this.fetchCredentials()
    if (this.props.spreadsheet) return this.fetchSheet()
    return this.setState({ loading_sheet: false })
  }

  /* * * * * * * * * * * * * * * * *
   *
   * WILL UNMOUNT
   *
   * * * * * * * * * * * * * * * * */
  componentWillUnmount () {
    document.removeEventListener('keydown', this.listenToKeyStrokes)
  }

  /* * * * * * * * * * * * * * * * *
   *
   * SHOULD UPDATE
   *
   * * * * * * * * * * * * * * * * */
  shouldComponentUpdate (props, nextState) {
    const changedKeys = []
    Object.keys(nextState).forEach(key => {
      if (this.state[key] !== nextState[key]) changedKeys.push(key)
    })
    if (changedKeys.length === 1 &&
      changedKeys.includes('keystrokes_history')) return false
    return true
  }

  /* * * * * * * * * * * * * * * * *
   *
   * FETCH CREDENTIALS
   *
   * * * * * * * * * * * * * * * * */
  async fetchCredentials () {
    const { api_url } = this.props
    const { format, article } = this.props.tracking
    const api = `${api_url}/${format}/${article}/load`
    try {
      const reach = await window.fetch(api, { method: 'POST' })
      const response = await reach.json()
      const { lblb_tracking, lblb_posting } = response._credentials
      if (!window.LBLB_GLOBAL) window.LBLB_GLOBAL = {}
      window.LBLB_GLOBAL.lblb_tracking = lblb_tracking
      window.LBLB_GLOBAL.lblb_posting = lblb_posting
      return { lblb_tracking, lblb_posting }
    } catch (error) {
      console.error('Unable to fetch credentials:')
      console.error(error)
      return Error(error)
    }
  }

  /* * * * * * * * * * * * * * * * *
   *
   * FETCH SHEET
   *
   * * * * * * * * * * * * * * * * */
  async fetchSheet () {
    this.setState({ loading_sheet: true, error_sheet: null })
    const sheet = this.props.spreadsheet
    try {
      const reach = await window.fetch(this.props.spreadsheet)
      if (!reach.ok) throw reach
      const data = await reach.text()
      const parsedData = data // Parse sheet here
      this.setState({ loading_sheet: false, error_sheet: null, data_sheet: parsedData })
      return data
    } catch (error) {
      if (error.status) {
        const text = `${error.status} error while fetching : ${sheet}`
        this.setState({ loading_sheet: false, error_sheet: error })
        console.error(text, error)
        return Error(text)
      } else {
        this.setState({ loading_sheet: false, error_sheet: error })
        console.error(error)
        return Error(error)
      }
    }
  }

  /* * * * * * * * * * * * * * * * *
   *
   * START LISTENING KEYSTROKES
   *
   * * * * * * * * * * * * * * * * */
  listenToKeyStrokes (e) {
    if (!e || !e.keyCode) return
    const currHistory = this.state.keystrokes_history
    const newHistory = [...currHistory, e.keyCode]
    this.setState({ keystrokes_history: newHistory })
    this.watchKonamiCode()
  }

  /* * * * * * * * * * * * * * * * *
   *
   * WATCH KONAMI CODE
   *
   * * * * * * * * * * * * * * * * */
  watchKonamiCode () {
    const konamiCodeStr = '38,38,40,40,37,39,37,39,66,65'
    const lastTenKeys = this.state.keystrokes_history.slice(-10)
    if (lastTenKeys.join(',') === konamiCodeStr) this.setState({ konami_mode: true })
  }

  /* * * * * * * * * * * * * * * * *
   *
   * HANDLE ACTIVATE GAME MODE
   *
   * * * * * * * * * * * * * * * * */
  async handleActivateGameMode (e) {
    try {
      this.setState(curr => ({
        ...curr,
        loading_cities: true,
        error_cities: null,
        data_cities: []
      })) 
      const request = `${serverUrl}/get-10-cities`
      const response = await window.fetch(request, {
        method: 'GET',
        credentials: 'include'
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const body = await response.json()
      if (body.err) throw new Error(body.err)
      this.setState(curr => ({
        ...curr,
        mode: 'game',
        loading_cities: false,
        error_cities: null,
        data_cities: body.data
      })) 
    } catch (err) {
      this.setState(curr => ({
        ...curr,
        loading_cities: false,
        error_cities: err.message,
        data_cities: []
      }))
    }
  }

  /* * * * * * * * * * * * * * * * *
   *
   * HANDLE VOTE
   *
   * * * * * * * * * * * * * * * * */
  async handleVote (cityName, voteValue) {
    if (!cityName || !voteValue) return

    // If last city is not reached, push vote and go on
    if (this.state.current_city_nb < 9) return this.setState(current => ({
      ...current,
      pending_votes: [...current.pending_votes, { name: cityName, vote: voteValue }],
      current_city_nb: current.current_city_nb < 9 ? current.current_city_nb + 1 : + 0
    }))

    // If last city, submit vote, wait for results and go to results page
    try {
      const votes = [...this.state.pending_votes, { name: cityName, vote: voteValue }]
      this.setState(curr => ({
        ...curr,
        loading_results: true,
        error_results: null,
        data_results: []
      }))
      const request = `${serverUrl}/submit-votes`
      const response = await window.fetch(request, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(votes),
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
      const body = await response.json()
      if (body.err) throw new Error(body.err)
      this.setState(curr => ({
        ...curr,
        loading_results: false,
        error_results: null,
        data_results: [...body.data],
        data_votes_cnt: body.votes_cnt,
        mode: 'results'
      }))
    } catch (err) {
      this.setState(curr => ({
        ...curr,
        loading_results: false,
        error_results: err.message,
        data_results: [],
        mode: 'results'
      }))
    }
  }

  handleActivateResultsGaugeMode (e) {
    this.setState(current => ({
      ...current,
      results_mode: 'gauge'
    }))
  }

  handleActivateResultsMapMode (e) {
    this.setState(current => ({
      ...current,
      results_mode: 'map'
    }))
  }

  /* * * * * * * * * * * * * * * * *
   *
   * RENDER
   *
   * * * * * * * * * * * * * * * * */
  render () {
    const { c, state, props } = this

    /* Assign classes */
    const classes = [c]
    if (state.loading_sheet || state.loading_cities || state.loading_results) classes.push(`${c}_loading`)
    if (state.error_sheet || state.error_cities || state.error_results) classes.push(`${c}_error`)
    if (state.mode === 'intro') classes.push(`${c}_intro-mode`)
    if (state.mode === 'game') classes.push(`${c}_game-mode`)
    if (state.mode === 'results') classes.push(`${c}_results-mode`)
    if (state.results_mode === 'map') classes.push(`${c}_map-results-mode`)

    /* Load & errors */
    if (state.loading_sheet || state.loading_cities || state.loading_results) {
      return <div className={classes.join(' ')}>
        <div className='lblb-default-apps-loader'>
          <Loader />
        </div>
      </div>
    } else if (state.error_sheet) {
      return <div className={classes.join(' ')}>
        <div className='lblb-default-apps-error'>
          <Paragraph>{state.error_sheet}</Paragraph>
          <LoadingError />
        </div>
      </div>
    } else if (state.error_cities) {
      return <div className={classes.join(' ')}>
        <div className='lblb-default-apps-error'>
          <Paragraph>{state.error_cities}</Paragraph>
          <LoadingError />
        </div>
      </div>
    } else if (state.error_results) {
      return <div className={classes.join(' ')}>
        <div className='lblb-default-apps-error'>
          <Paragraph>{state.error_results}</Paragraph>
          <LoadingError />
        </div>
      </div>
    }

    /* Logic */
    const currentCityNb = state.current_city_nb
    const currentCity = state.data_cities.length ? state.data_cities[currentCityNb] : {}
    const currentCityName = currentCity.name

    const fakeData = [
      { "name": "Paris", "latitude": 48.856614, "longitude": 2.3522219, "north": 0, "south": 0, "idk": 0 },
      { "name": "Marseille", "latitude": 43.296482, "longitude": 5.36978, "north": 0, "south": 0, "idk": 0 },
      { "name": "Lyon", "latitude": 45.764043, "longitude": 4.835659, "north": 0, "south": 0, "idk": 0 },
      { "name": "Toulouse", "latitude": 43.604652, "longitude": 1.444209, "north": 0, "south": 0, "idk": 0 },
      { "name": "Nice", "latitude": 43.7101728, "longitude":  7.261953200000001, "north": 0, "south": 0, "idk": 0 },
      { "name": "Nantes", "latitude": 47.218371, "longitude": -1.553621, "north": 0, "south": 0, "idk": 0 },
      { "name": "Montpellier", "latitude": 43.610769, "longitude": 3.876716, "north": 0, "south": 0, "idk": 0 },
      { "name": "Strasbourg", "latitude": 48.5734053, "longitude":  7.752111299999999, "north": 0, "south": 0, "idk": 0 },
      { "name": "Bordeaux", "latitude": 44.837789, "longitude": -0.57918, "north": 0, "south": 0, "idk": 0 },
      { "name": "Lille", "latitude": 50.62925, "longitude":  3.057256, "north": 0, "south": 0, "idk": 0 },
      { "name": "Rennes", "latitude": 48.117266, "longitude": -1.6777926, "north": 0, "south": 0, "idk": 0 },
      { "name": "Reims", "latitude": 49.258329, "longitude": 4.031696, "north": 0, "south": 0, "idk": 0 },
      { "name": "Saint-Étienne", "latitude": 45.439695, "longitude": 4.3871779, "north": 0, "south": 0, "idk": 0 },
      { "name": "Toulon", "latitude": 43.124228, "longitude": 5.928, "north": 0, "south": 0, "idk": 0 },
      { "name": "Le Havre", "latitude": 49.49437, "longitude":  0.107929, "north": 0, "south": 0, "idk": 0 },
      { "name": "Grenoble", "latitude": 45.188529, "longitude": 5.724524, "north": 0, "south": 0, "idk": 0 },
      { "name": "Dijon", "latitude": 47.322047, "longitude": 5.04148, "north": 0, "south": 0, "idk": 0 },
      { "name": "Angers", "latitude": 47.47116159999999, "longitude": -0.5518257, "north": 0, "south": 0, "idk": 0 },
      { "name": "Nîmes", "latitude": 43.836699, "longitude": 4.360054, "north": 0, "south": 0, "idk": 0 },
      { "name": "Saint-Denis", "latitude": 48.936181, "longitude": 2.357443, "north": 0, "south": 0, "idk": 0 },
      { "name": "Villeurbanne", "latitude": 45.771944, "longitude": 4.8901709, "north": 0, "south": 0, "idk": 0 },
      { "name": "Clermont-Ferrand", "latitude": 45.77722199999999, "longitude": 3.087025, "north": 0, "south": 0, "idk": 0 },
      { "name": "Le Mans", "latitude": 48.00611000000001, "longitude": 0.199556, "north": 0, "south": 0, "idk": 0 },
      { "name": "Aix-en-Provence", "latitude": 43.529742, "longitude": 5.447426999999999, "north": 0, "south": 0, "idk": 0 },
      { "name": "Brest", "latitude": 48.390394, "longitude": -4.486076, "north": 0, "south": 0, "idk": 0 },
      { "name": "Tours", "latitude": 47.394144, "longitude": 0.68484, "north": 0, "south": 0, "idk": 0 },
      { "name": "Amiens", "latitude": 49.894067, "longitude": 2.295753, "north": 0, "south": 0, "idk": 0 },
      { "name": "Limoges", "latitude": 45.83361900000001, "longitude": 1.261105, "north": 0, "south": 0, "idk": 0 },
      { "name": "Annecy", "latitude": 45.899247, "longitude": 6.129384, "north": 0, "south": 0, "idk": 0 },
      { "name": "Perpignan", "latitude": 42.6886591, "longitude":  2.8948332, "north": 0, "south": 0, "idk": 0 },
      { "name": "Boulogne-Billancourt", "latitude": 48.8396952, "longitude":  2.2399123, "north": 0, "south": 0, "idk": 0 },
      { "name": "Orléans", "latitude": 47.902964, "longitude": 1.909251, "north": 0, "south": 0, "idk": 0 },
      { "name": "Metz", "latitude": 49.1193089, "longitude":  6.175715599999999, "north": 0, "south": 0, "idk": 0 },
      { "name": "Besançon", "latitude": 47.237829, "longitude": 6.024053899999999, "north": 0, "south": 0, "idk": 0 },
      { "name": "Nancy", "latitude": 48.692054, "longitude": 6.184417, "north": 0, "south": 0, "idk": 0 },
      { "name": "Argenteuil", "latitude": 48.9472096, "longitude":  2.2466847, "north": 0, "south": 0, "idk": 0 },
      { "name": "Rouen", "latitude": 49.44323199999999, "longitude": 1.099971, "north": 0, "south": 0, "idk": 0 },
      { "name": "Montreuil", "latitude": 48.863812, "longitude": 2.448451, "north": 0, "south": 0, "idk": 0 },
      { "name": "Mulhouse", "latitude": 47.750839, "longitude": 7.335888, "north": 0, "south": 0, "idk": 0 },
      { "name": "Caen", "latitude": 49.182863, "longitude": -0.370679, "north": 0, "south": 0, "idk": 0 }
    ]

    /* Display component */
    return <div className={classes.join(' ')}>
      {/* Intro */}
      <div className='intro-panel'>
        <img src='./logo.svg' />
        <PageTitle small>On&nbsp;dirait le&nbsp;sud</PageTitle>
        <Overhead>Calculateur de sud ressenti</Overhead>
        <Paragraph literary>
          Limoges, au nord ou au sud&nbsp;? Maubeuge la méridionale ou l'australe&nbsp;?<br /><br />
          Il y a la réalité géographique et puis le ressenti.<br /><br />
          Nous avons sélectionné dix villes parmi les plus peuplées de France. Placez-les au nord ou au sud selon l'image que vous en avez pour nous permettre de mesurer le décalage entre les faits et votre perception
        </Paragraph>
        <button onClick={this.handleActivateGameMode}>
          <Overhead big>Jouer</Overhead>
        </button>
      </div>

      {/* Game */}
      <div className='game-panel'>
        <div className='game-panel__counter'>
          <Paragraph big>{`${currentCityNb + 1}/10`}</Paragraph>
        </div>
        <div className='game-panel__city-name'>
          <Overhead big>{`${currentCityName}`}</Overhead>
        </div>
        <div className='game-panel__buttons'>
          <button
            className='game-panel__north-button'
            onClick={e => this.handleVote(currentCityName, 'north')}>
            <Overhead small>Au nord</Overhead>
            <Paragraph>aucun doute là dessus</Paragraph>
          </button>
          <button
            className='game-panel__south-button'
            onClick={e => this.handleVote(currentCityName, 'south')}>
            <Overhead small>Au sud</Overhead>
            <Paragraph>c'est sûr</Paragraph>
          </button>
          <button
            className='game-panel__idk-button'
            onClick={e => this.handleVote(currentCityName, 'idk')}>
            <Paragraph>Alors là franchement</Paragraph>
            <Overhead small>aucune idée</Overhead>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className='results-panel'>
        <div className='results-panel__jauge'>
          <div className='results-panel__text'>
            <div className='results-panel__head'>
              <Overhead big>Sud ressenti</Overhead>
              <Overhead big>en pourcentage</Overhead>
            </div>
            <div className='results-panel__text'>
              <Paragraph literary>
              {`Votre vote a été ajouté aux ${state.data_votes_cnt} votes précédents pour calculer le taux de Sud ressenti de la France (axe central) : si tous les votants ont placé une ville au Nord, son pourcentage de Sud ressenti est de 0%.`}
              <br /><br />
              {`L’axe de gauche représente la latitude réelle de la ville : plus le lien qui relie une ville à sa latitude réelle est incliné, plus le pourcentage de Sud ressenti diffère de la réalité.`}
              </Paragraph>
            </div>
          </div>
          <Gauge data={/*fakeData*/state.data_results} />
          <button
            className='results-panel__primary-button'
            onClick={this.handleActivateResultsMapMode}>
            Voir les résultats sur une carte
          </button>
          <button
            className='results-panel__secondary-button'
            onClick={this.handleActivateGameMode}>
            Rejouer
          </button>
        </div>

        <div className='results-panel__map'>
          <div className='results-panel__text'>
            <div className='results-panel__head'>
              <Overhead big>Sud ressenti</Overhead>
              <Overhead big>en pourcentage</Overhead>
            </div>
            <div className='results-panel__text'>
              <Paragraph literary>
              {`Les cercles sont coloriés par rapport au taux de Sud ressenti présenté précédemment.`}
              <br /><br />
              {`Les couleurs du fond de carte correspondent à la latitude réelle des zones coloriées : si un cercle gris est placé dans la zone rose, c’est que les lecteurs l’imaginent au Nord alors qu’il est au Sud, et vice versa.`}
              </Paragraph>
              <FranceMap data={/*fakeData*/state.data_results} />
              <button
                className='results-panel__primary-button'
                onClick={this.handleActivateGameMode}>
                Rejouer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className='lblb-default-apps-footer'>
        <ShareArticle short iconsOnly tweet={props.meta.tweet} url={props.meta.url} />
        <Paragraph small>
          <span>Production : </span>
          <a href='https://www.liberation.fr/auteur/18438-clara-dealberto'>Clara&nbsp;Dealberto</a>
          <span> et&nbsp;</span>
          <a href='https://www.liberation.fr/auteur/19310-maxime-fabas'>Maxime&nbsp;Fabas</a>
        </Paragraph>
        <LibeLaboLogo target='blank' />
      </div>
    </div>
  }
}
