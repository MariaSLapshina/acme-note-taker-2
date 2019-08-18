const { Link, Route, Switch, Redirect, HashRouter } = ReactRouterDOM
const { Component } = React
const { render } = ReactDOM
const root = document.querySelector("#root")


const Nav = ({ path, notes }) => {
    const notesCount = notes.reduce((acc, curnote) => {
        if (!curnote.archived) acc++
        return acc
    }, 0);
    const arcCount = notes.reduce((acc, curnote) => {
        if (curnote.archived) acc++
        return acc
    }, 0)
    return (
        <nav>
            <Link to="/notes" className={path === "/notes" ? 'selected' : ''}>Notes ({notesCount})</Link>
            <Link to="/archived" className={path === "/archived" ? 'selected' : ''}>Archived ({arcCount})</Link>
            <Link to="/notes/create" className={path === "/notes/create" ? 'selected' : ''}>Create</Link>
        </nav>
    )
}

const Notes = ({ notes, onUpdateNote, onDestroyNote }) => {
    const unarchived = notes.filter((note) => !note.archived)
    return (
        <ul>
            { unarchived.map(note => {
                return (
                    <li key={ note.id }>
                        <Link to={`/notes/${note.id}`}>{ note.text }</Link>
                        <button onClick={() => onUpdateNote(note.id, true, note.text)}>archive</button>
                        <button onClick={() => onDestroyNote(note.id)}>destroy</button>
                    </li>
                )
            })}
        </ul>
    )
}

const Archived = ({ notes, onUpdateNote, onDestroyNote }) => {
    const archived = notes.filter((note) => note.archived)
    return (
        <ul>
            { archived.map(note => {
                return (
                    <li key={ note.id }>
                        { note.text }
                        <button onClick={() => onUpdateNote(note.id, false, note.text)}>unarchive</button>
                        <button onClick={() => onDestroyNote(note.id)}>destroy</button>
                    </li>
                )
            })}
        </ul>
    )
}
class Update extends Component{
    constructor(props){
        super(props)
        const note = this.props.notes.find(note =>note.id === this.props.match.params.id)
        const text = note ? note.text : ""
        this.state = {
            originalText: text,
            text
        }
        this.onTextUpdate = this.onTextUpdate.bind(this)
        this.onUpdate = this.onUpdate.bind(this)
    }

    onTextUpdate(text) {
        this.setState({ text })
    }

    onUpdate(text) {
        const { id } = this.props.match.params
        this.props.onUpdate(id,text)
        this.props.history.push('/notes')
    }

    componentDidUpdate() {
        const found = this.props.notes.find(note =>note.id === this.props.match.params.id)
        if(!this.state.text && found){
            this.setState({text: found.text})
        }
        console.log('update')
    }

    async componentDidMount() {
        console.log('mounted')
        const user = await fetchUser()
        const notes = await getNotes(user.id)
        const note = notes.find(note => note.id === this.props.match.params.id)
        this.setState({text: note.text, originalText: note.text})
    }

    render(){
        const { text, originalText } = this.state
        return (
            <div>
                <input type  = 'text' value = {text} onChange = {(ev)=> this.onTextUpdate(ev.target.value)}/>
                <button disabled = {text===originalText} onClick = {()=> this.onUpdate(text)}>Update</button>
            </div>
        ) 
    }
}

class Create extends Component {
    constructor() {
        super()
        this.state = {
            text: ''
        }
        this.onTextUpdate = this.onTextUpdate.bind(this)
        this.onCreate = this.onCreate.bind(this)
    }
    onTextUpdate(text){
        this.setState({text})
    }

    onCreate(text) {
        this.props.onCreateNote(text)
        this.props.history.push("/notes")
    }

    render () {
        const { text } = this.state
        return (
            <div>
            <input type = 'text' value = {text} onChange = {(ev)=> this.onTextUpdate(ev.target.value)}/>
            <button disabled = {!text} onClick = {() => this.onCreate(text)}>Create</button>
            </div>
        )
    }
}

class App extends Component {
    constructor() {
        super()
        this.state = {
            user: {},
            notes: []
        }
        this.onUpdateNote = this.onUpdateNote.bind(this)
        this.onDestroyNote = this.onDestroyNote.bind(this)
        this.onCreateNote = this.onCreateNote.bind(this)
        this.onUpdate = this.onUpdate.bind(this)
    }
    async componentDidMount() {
        const user = await fetchUser()
        const notes = await getNotes(user.id)
        this.setState({ user, notes })
    }
    async onUpdateNote(noteId, archived, text) {
        const userId = this.state.user.id
        const { notes } = this.state
        const updated = await putNotes({userId, noteId, archived, text})
        const updateNotes = notes.map(note => note.id === updated.id ? updated : note)
        this.setState({ notes: updateNotes })
    }
    async onDestroyNote(noteId) {
        const userId = this.state.user.id
        const { notes } = this.state
        const updatedNotes = notes.filter(note => note.id !== noteId)
        deleteNotes({ userId, noteId })
        this.setState({ notes: updatedNotes })
    }
    async onCreateNote(text){
        const userId = this.state.user.id
        const { notes } = this.state
        const newNote = await postNotes({userId, archived: false, text})
        console.log('note created!->', newNote)
        const updatedNotes = [...notes, newNote]
        this.setState({ notes: updatedNotes })
    }
    async onUpdate(noteId,text){
        const userId = this.state.user.id
        const { notes } = this.state
        const updated = await putNotes({userId, noteId, archived:false, text})
        const updateNotes = notes.map(note => note.id === updated.id ? updated : note)
        this.setState({ notes: updateNotes })
    }

    render() {
        const { notes, user } = this.state
        return (
            <HashRouter>
                <Route render={({ location }) => <Nav path={location.pathname} notes={notes} />} />
                <h1>Acme Note-taker for {user.fullName}</h1>
                <Switch>
                    <Route exact path='/notes' render={() => <Notes notes={notes} onUpdateNote={this.onUpdateNote} onDestroyNote={this.onDestroyNote}/>}/>
                    <Route exact path='/archived' render={() => <Archived notes={notes} onUpdateNote={this.onUpdateNote} onDestroyNote={this.onDestroyNote}/>}/>}/>
                    <Route exact path='/notes/create' render={(props) => <Create {...props} onCreateNote={this.onCreateNote} />}/>
                    <Route exact path="/notes/:id" render={(props)=> <Update {...props} notes={notes} onUpdate={this.onUpdate}/>}/>
                </Switch>
            </HashRouter>
        )
    }
}

render(<App />, root)