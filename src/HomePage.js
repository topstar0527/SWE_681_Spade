import React from 'react';
import { connect } from 'react-redux';
import { hideSplashScreen } from './LoadMaskHelper.js';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import { withRouter } from 'react-router-dom';
import Checkbox from 'material-ui/Checkbox';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Promise from 'bluebird';
import Avatar from 'material-ui/Avatar';
import Dialog from 'material-ui/Dialog';
import ComponentLoadMask from './ComponentLoadMask.js';
import RefreshIndicator from 'material-ui/RefreshIndicator';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';
import AppBar from 'material-ui/AppBar';
import Paper from 'material-ui/Paper';
import { makeServerCall } from './ServerCallHelper.js';
import Flexbox from 'flexbox-react';


class HomePage extends React.Component {
	
	
	state = {
		passwordPromptDialogOpen: false,
		createNewGamePasswordDialogOpen: false,
		activeGamesList:[],
		newGamePassword: null,
		passwordProtection: false,
		imageURL: "./img/8C.png",
		selectedGameListIndex: null
    };
	
	componentDidMount(){
		//make call to get the list of active games and then update the state.
		//make call to get the data from the server and then create rows.
		this.refreshActiveGameList(this);
	}
	
	gotoGamePlayArea(gid){
		gid ? this.props.history.push('/game#'+gid) : this.props.history.push('/game');
	}
	
	onSuccessJoinGame(cont){
		
		//Make Servercall indicating the request of user to join.
		var url = 'joinGame?gid=' + this.state.activeGamesList[this.state.selectedGameListIndex].id;
		var context = cont ? cont : this;
		makeServerCall(url, function(response, options){
			
			var result; 
        
			try {
				result = JSON.parse(response);
			}
			catch(e) {
				result = null;
			}
			
			if(result && result.joined){
				context.props.dispatch(saveGameInfo(result.GameInfo));
				context.props.dispatch(saveCurrentPlayerInfo(result.CurrentPlayerInfo));
				context.gotoGamePlayArea();
			}
			
		});
		
		
	}
	
	openCloseDialog(type,open){
		
		switch(type){
			case 'PasswordPrompt':
				this.setState({passwordPromptDialogOpen: open});
			break;
			case 'newGamePassword':
				this.setState({createNewGamePasswordDialogOpen: open,passwordProtection: false});
			break;
		}
	
	}
	
	refreshActiveGameList(context){
				
		var url = 'fetchActiveGamesList';
		makeServerCall(url, function(response, options){
			
			var result; 
        
			try {
				result = JSON.parse(response);
			}
			catch(e) {
				result = null;
			}
			
			result == null ? context.setState({activeGamesList: []}) : context.setState({activeGamesList: result});
		});
		
		
	}
	
	createActiveGameRows(){
		var rows = [];
		var context = this;
		for(var index=0;index<this.state.activeGamesList.length;index++)
		{
			let temp = index;
			rows.push(
				<TableRow key = { index } style = {{ height:'24px' }}>
					<TableRowColumn>{this.state.activeGamesList[index].id}</TableRowColumn>
					<TableRowColumn>{this.state.activeGamesList[index].nameOfInitiatingPlayer}</TableRowColumn>
					<TableRowColumn>{this.state.activeGamesList[index].numOfPlayers}</TableRowColumn>
					{this.state.activeGamesList[index].passwordProtected ? <TableRowColumn><i className="fa fa-lock fa-2x" /></TableRowColumn> : <TableRowColumn></TableRowColumn>}
					<TableRowColumn>
						{ this.state.activeGamesList[index].passwordProtected ?
							<RaisedButton 
								primary={true} 
								label="Join"
								onClick={() =>  {this.setState({selectedGameListIndex: temp}); this.openCloseDialog('PasswordPrompt',true);} } 
								
							/>
						:
							<RaisedButton 
								primary={true} 
								label="Join" 
								onClick={() => {
									this.setState(
											{selectedGameListIndex: temp}, 
											() => this.onSuccessJoinGame(context)
										);
									} 
								}
							/>
						}
					</TableRowColumn>
				</TableRow>
			);
		}
		
		return rows;
	}
	
	createHistoryRows(list){
		var rows=[];
		
		for(var index=0;index<this.props.UserInfo.historyGamesList.length;index++)
		{
			let temp = index;
			rows.push(
				<TableRow key = { index } style = {{ height:'24px' }}>
					<TableRowColumn>{new Date(this.props.UserInfo.historyGamesList[index].date).toDateString()}</TableRowColumn>
					<TableRowColumn>{this.props.UserInfo.historyGamesList[index].result}</TableRowColumn>
					//<TableRowColumn>{this.props.UserInfo.historyGamesList[index].score}</TableRowColumn>
					//<TableRowColumn>{this.props.UserInfo.historyGamesList[index].coinsEarned}</TableRowColumn>
				</TableRow>
			);
		}
		
		return rows;
	}
	
	startNewGame(password) {
		//makeServerCall to star to new game
		var deck = window.Deck();
		deck.shuffle();
		
		
		var url = 'createNewGame?password='+password+'&cards='+encodeURI(JSON.stringify(deck.cards));
		
		var context=this;
		makeServerCall(url, function(response, options){
			
			var result; 
        
			try {
				result = JSON.parse(response);
			}
			catch(e) {
				result = null;
			}
			
			if(result != null){
				
				
				let pom = new Promise(function (resolve, reject) {
                    context.props.dispatch(saveGameInfo(result.GameInfo));
					context.props.dispatch(saveCurrentPlayerInfo(result.CurrentPlayerInfo));
					resolve('done');
				});

				pom.then(() => context.gotoGamePlayArea());
				
			}
		});
	}
	
	render() {
		hideSplashScreen();
		var activeGamesRows = this.createActiveGameRows();
		var historyRows = this.createHistoryRows();
		var context = this;
		return (
			<div>
				<Flexbox className="HomeOuterContainer" flexDirection="column" minHeight="100vh">
					<Flexbox className="HomeTopOuterContainer" flexDirection="row" flexGrow={1} >
						
						
						{/* User Information Card */}
						<Paper 
							style={{
									  flex:1,
									  margin: 20,
									  textAlign: 'center',
									  display: 'inline-block',
							}} 
							zDepth={2}>
						
						<Flexbox 
							flexDirection="row"
							
						>
							{/* Avatar Container */}
							<Flexbox 
								flexGrow={1}
								style={{
									margin: 20,
									textAlign: 'center',
									display: 'inline-block',
								}} 
							>
								<Avatar
								  id="userAvatar"
								  size={100}
								  src="./img/spade.png"
								  backgroundColor="white"
								  style={{margin: 5, flex:1}}
								/>
							</Flexbox>
							
							{/* User Information Container */}
							<Flexbox 
								flexGrow={3}
								style={{
									margin: 20,
									textAlign: 'center',
									display: 'inline-block',
								}}
							>
								<h1>{this.props.UserInfo.infoDetails.name}</h1>
								<br />
								<hr />
								
								{/* USER STATS */}
								<Flexbox 
									flexDirection="row"
									style={{
										margin: 20,
										textAlign: 'center',
										display: 'inline-block',
									}}
								>
									<Flexbox 
										flexGrow={1}
										style={{
											margin: 20,
											textAlign: 'center',
											display: 'inline-block',
										}}
									>
										<h2>Games Played </h2> <br />
										 <span style={{fontSize: "25px"}}> {this.props.UserInfo.userStatistics.gamesPlayed} < /span>
									</Flexbox>
									
									<Flexbox 
										flexGrow={1}
										style={{
											margin: 20,
											textAlign: 'center',
											display: 'inline-block',
										}}
									>
										<h2> Win/Loss </h2><br />
										<span style={{fontSize: "25px"}}> {this.props.UserInfo.userStatistics.winLoss} </span>
									</Flexbox>
									
									{/*<Flexbox 
										flexGrow={1}
										style={{
											margin: 20,
											textAlign: 'center',
											display: 'inline-block',
										}}
									>
										<h2> Coins </h2> <br />
										<span style={{fontSize: "35px"}}> {this.props.UserInfo.userStatistics.coins} </span>
									</Flexbox>
									*/}
								</Flexbox>
							</Flexbox>
							
						</Flexbox>
							
						</Paper>
						
						{/* History */}
						<Paper 
							style={{
								  flex:1,
								  margin: 20,
								  textAlign: 'center',
								  display: 'inline-block',
								  overflow: 'auto'
							}}
							zDepth={2} >
							
							<Table
									selectable={true}
								>
									<TableHeader
										displaySelectAll={false}
										adjustForCheckbox={false}
									>
									  <TableRow>
										<TableHeaderColumn>Date</TableHeaderColumn>
										<TableHeaderColumn>Win/Loss</TableHeaderColumn>
										//<TableHeaderColumn>Final Score</TableHeaderColumn>
										<TableHeaderColumn>Coins Earned</TableHeaderColumn>
									  </TableRow>
									
									</TableHeader>
									
									<TableBody
										displayRowCheckbox={false}
									>
									{historyRows}
									  
									</TableBody>
								</Table>
							
						</Paper>
					</Flexbox>
					
					{/* Active Games */}
					<Flexbox className="HomeBottomOuterContainer" flexDirection="column" element="header" flexGrow={1} >
						<Paper 
							style={{
									  flex:1,
									  margin: 20,
									  textAlign: 'center',
									  display: 'inline-block',
									  overflow: 'auto'
							}} 
							zDepth={2} >
								
								<Table
									selectable={true}
								>
									<TableHeader
										displaySelectAll={false}
										adjustForCheckbox={false}
									>
									  <TableRow>
										<TableHeaderColumn>Game ID</TableHeaderColumn>
										<TableHeaderColumn>Initiating Player</TableHeaderColumn>
										<TableHeaderColumn>Players</TableHeaderColumn>
										<TableHeaderColumn>Password Protected</TableHeaderColumn>
										<TableHeaderColumn>
											<RaisedButton primary={true} label="Refresh" onClick={() => this.refreshActiveGameList(this)}/> &nbsp;
											<RaisedButton primary={true} label="New Game" onClick={() => this.openCloseDialog('newGamePassword',true)}/>
										</TableHeaderColumn>
									  </TableRow>
									
									</TableHeader>
									
									<TableBody
										displayRowCheckbox={false}
									>
									
									{activeGamesRows}
									  
									</TableBody>
								</Table>
						</Paper>
					</Flexbox>
				</Flexbox>
				
				
				
				{/* Password Prompt Dialog */}
				<Dialog
				  title="Password Prompt"
				  modal={false}
				  open={this.state.passwordPromptDialogOpen}
				  onRequestClose={() => this.openCloseDialog('PasswordPrompt',false)}
				>
				This game is password protected. Please note that all passwords are a maximum of 10 characters and only alphanumeric. Please enter the password. <br />
					<TextField
					  id="gameJoinPassword"
					  type="password"
					/><br />
					<label id="err" style={{color:'red'}}>{context.state.lblErrText}</label>
					<RaisedButton 
						label="Join" 
						onClick={() => {
								context.setState({lblErrText: ""});
								if(document.getElementById('gameJoinPassword').value.length < 11 && context.state.activeGamesList[context.state.selectedGameListIndex].password === document.getElementById('gameJoinPassword').value)
								{
									context.openCloseDialog('PasswordPrompt',false);
									//make server call for player to join.
									context.onSuccessJoinGame();
								}else{
									context.setState({lblErrText: "Incorrect Password or Too Long"});
								}
							}
						} 
						primary={true}/>
				</Dialog>
				
				
				
				{/* New Game Password Prompt Dialog */}
				<Dialog
				  title="Please Enter a password"
				  modal={false}
				  open={this.state.createNewGamePasswordDialogOpen}
				  onRequestClose={() => this.openCloseDialog('newGamePassword',false)}
				>
				If you want to make this game password protected please select the checkbox and enter a password. 
				Please note that all passwords are a maximum of 10 characters and only alphanumeric.<br />
					<Checkbox
					  label="Password Protected"
					  checked={this.state.passwordProtection}
					  onCheck={(evt,isInputChecked) => {
						  this.setState({passwordProtection: isInputChecked});
					  }}
					/>
					<br />
					<TextField
					  id="gameCreatePassword"
					  disabled={this.state.passwordProtection ? false : true}
					  type="password"
					/><br />
					<label id="err" style={{color:'red'}}>{context.state.lblErrText2}</label>
					<RaisedButton 
						label="Create New Game" 
						onClick={() => {
								context.setState({lblErrText2: ""});
								var str = document.getElementById('gameCreatePassword').value;
								if(!this.state.passwordProtection || (str.length < 11 && str.match(/^[a-z0-9]+$/i))) //add regex for alphanumeric check.
								{
									context.openCloseDialog('newGamePassword',false);
									//make server call for player to join.
									context.startNewGame(str);
								}else{
									context.setState({lblErrText2: "Please follow the password guidelines."});
								}
							}
						} 
						primary={true}/>
				</Dialog>
				
				
				<FloatingActionButton 
                    style = {{
                        top: '5px',
                        right: '5px',
                        position: 'absolute',
                        zIndex: '10',
                    }} 
					backgroundColor = 'white'
                    onClick = { () => this.props.history.push('/logout') }
                >
                    <i 
                        className = "fa fa-2x fa-times" 
                        style = {{
							color:'red',
                        }}
                    /> 
                </FloatingActionButton>
				
			</div>
		);
	}
}

/**
 * Constants defined to make dispatching for the redux store consistent
 **/
export const saveGameInfo = (gameInfo) => ({
    type: 'SAVE_GAME_INFO',
    gameInfo
});

export const saveCurrentPlayerInfo = (CurrentPlayerInfo) => ({
    type: 'SAVE_CURRENTPLAYER_INFO',
    CurrentPlayerInfo
});

/**
 * Maps portions of the store to props of your choosing
 * @param state: passed down through react-redux's 'connect'
 **/
const mapStateToProps = function(state){
  return {
	  UserInfo: state.globalObject.UserInfo,
	  GameInfo: state.globalObject.GameInfo
  }
}

export default withRouter(connect(mapStateToProps)(HomePage));