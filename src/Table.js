import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Flexbox from 'flexbox-react';
import { hideSplashScreen } from './LoadMaskHelper.js';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import RaisedButton from 'material-ui/RaisedButton';
import ComponentLoadMask from './ComponentLoadMask.js';
import Dialog from 'material-ui/Dialog';
import socketIOClient from 'socket.io-client'
import Snackbar from 'material-ui/Snackbar';
import Avatar from 'material-ui/Avatar';
import ListItem from 'material-ui/List/ListItem';
import NumberInput from 'material-ui-number-input';
import TextField from 'material-ui/TextField';
import Promise from 'bluebird';
import { makeServerCall } from './ServerCallHelper.js';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

import './Card.css';

const style = {margin: 5};
const flexCenter = {alignItems: 'center'};


/*

card.rank

1 - A
2 - 2
3 - 3
..
10 - 10
11 - J
12 - Q
13 - K

card.suit

Suits:
0 - Spades
1 - Hearts 
2 - Clubs
3 - Diamond

*/

class GamePlayBoard extends Component {
	
	rankTranslation={
		1: "A",
		2: "2",
		3: "3",
		4: "4",
		5: "5",
		6: "6",
		7: "7",
		8: "8",
		9: "9",
		10: "T",
		11: "J",
		12: "Q",
		13: "K"
	}
	
	suitTranslation={
		0 : "S",
		1 : "H",
		2 : "C",
		3 : "D"
	}
	
	deck;
	endpoint = "https://ec2-34-227-161-141.compute-1.amazonaws.com:5001"
	socket = socketIOClient(this.endpoint);
	playerId = 1;
	
	constructor(props){
		super(props);
		var context=this;
		
		
		this.socket.on("gameUpdateClient"+this.props.GameInfo.id,(msg) => {
			
			var leftImg = document.getElementById('leftCardImg');
			var rightImg = document.getElementById('rightCardImg');
			var winnerLabel = document.getElementById('rightCardImg');
			var jsonVar = JSON.parse(msg);
			
			switch(jsonVar.type){
				
				case 'full':
					context.openCloseDialog('waitingLoadMask',true);
				break;
				
				case 'cardPlayed':
					context.setState({gameLog: context.state.gameLog + "\n" +context.props.GameInfo.players[jsonVar.playerId].uname + " played " + jsonVar.cardId.replace(".png","")});
					if(jsonVar.playerId == 1) 
					{
						leftImg.src = require("./img/"+jsonVar.cardId);
						leftImg.style.display = "";
						jsonVar.playerId = 2;
					}
					else{
						 rightImg.src = require("./img/"+jsonVar.cardId);
						 rightImg.style.display = "";
						 jsonVar.playerId = 1;
					}
				case 'turn':
					if(context.playerId == jsonVar.playerId && !jsonVar.wait){
						context.openCloseDialog('waitingLoadMask',false);
					}else{
						context.openCloseDialog('waitingLoadMask',true);
					}
				break;
				
				case 'playFinished':
					context.setState({gameLog: context.state.gameLog + "\n" +context.props.GameInfo.players[jsonVar.winner].uname + " won the Round!"});
					if(context.playerId == jsonVar.winner){
						//win  
						context.openCloseDialog('snackBar',{open:true,message:"You win this round!"})
					}else{
						//Loose
						context.openCloseDialog('snackBar',{open:true,message:"You loose this round!"})
					}
					leftImg.style.display = "none";
					rightImg.style.display = "none";
					context.openCloseDialog('waitingLoadMask',true);
				break;
				
				case 'gameFinished':
					//show stats and then exit!
					var message = "";
					context.playerId == jsonVar.winner ? message = "YOU WIN THE GAME!" : message = "YOU LOOSE THE GAME!";
					context.setState({gameFinished: true,gameResult: message});
					context.openCloseDialog('ScoreCard',true);
					context.finishGame(true);
					context.openCloseDialog('snackBar',{open:true,message: message});
				break;
			}
			jsonVar.GameInfo ? context.props.dispatch(saveGameInfo(jsonVar.GameInfo)) : null;
		});
		
		this.socket.on("gameReady"+this.props.GameInfo.id,(msg) => {
			try{
				var tempResult = JSON.parse(msg);
				var leftImg = document.getElementById('leftCardImg');
				var rightImg = document.getElementById('rightCardImg');				
				
				let pom = new Promise(function (resolve, reject) {
					context.props.dispatch(saveGameInfo(tempResult));
					resolve('done');
				});

				pom.then(() => {
					//put a singular deck object with a total of only 26 cards. 13 keep and 13 discard.
					context.renderInitialDeck(context);
					leftImg.style.display = "none";
					rightImg.style.display = "none";
					var str = context.state.gameLog + "\n ---INITIATING ROUND " +context.props.GameInfo.rounds + " ---"
							+ "\n " + tempResult.players[1].uname + " has score " + tempResult.players[1].totalScore
							+ "\n " + tempResult.players[2].uname + " has score " + tempResult.players[2].totalScore;
					
					this.setState({gameLog: str, 
						currentSelectionCardIndex: 0, 
						selectedCards:[] ,
						scoreCardDialogOpen: true, 
						cardSelectionDialogOpen: true
						},
						() => { 
							setTimeout(function(){ 
								var cardSelectionImg = document.getElementById('cardSelectionImg');
								cardSelectionImg.src = require("./img/" + context.rankTranslation[context.deck.cards[0].rank] + context.suitTranslation[context.deck.cards[0].suit] + ".png");
							}, 1000);
						
					});
				});
				
				
				
			}
			catch(err){
				console.log(err);
			}
		});
	}
	
	//if(this.props.GameInfo.gameInitiator == this.props.CurrentPlayerInfo.playerId) means that this is the server. Meaning all deals will happend here and then distributed to the players.
	componentDidMount() {
		var context = this;
		var centralContainerHeight = document.getElementsByClassName('CentralOuterContainer') ? document.getElementsByClassName('CentralOuterContainer')[0].clientHeight : "350px";
		var playArea = document.getElementById('CardPlayArea') ? document.getElementById('CardPlayArea') : null;
		
		if(playArea)
			playArea.style.height = centralContainerHeight + "px";
	}
	
	componentDidUpdate(){
		var textarea = document.getElementById('auditTextField');
		textarea.scrollTop = textarea.scrollHeight;
	}
	
	//socket.emit(eventName, msg);
	state = {
		scoreCardDialogOpen: false,
		bidDialogOpen: false,
		gameFinished: false,
		bidValue: null,
		quitGameDialogOpen:false,
		bidErrorText: '',
		currentSelectionCardIndex:0,
		gameInitiating: false,
		cardSelectionDialogOpen: false,
		selectedCards:[],
		imgURL: "",
		snackBarOpen: false,
		gameLog: "",
		gameResult: "",
		snackBarMessage: "",
    };
	
	renderInitialDeck(context){
		
		var cont = document.getElementById('container');
		
		if(context.deck != null)
			context.deck.unmount();
	
		context.deck = window.Deck();
		this.playerId = context.props.CurrentPlayerInfo.playerId;
		var removedCards=[];
		
		// add to DOM
		context.deck.mount(cont);
		
		var flag;
		context.deck.cards.reduceRight(function(acc,card,index,object){
			flag=false;
			card.setSide('back');
			
			context.props.GameInfo.players[context.playerId].currentChooseCards.forEach(function (currentChooseCards, i) {
				if(currentChooseCards.suit == card.suit && currentChooseCards.rank == card.rank)
				{
					flag=true;
				}
			});
			
			if(!flag)
			{
				card.$el.style.display="none";
				card.$el.classList.add("discard");
				removedCards.push(object.splice(index, 1));
			}
		}, []);
		
		context.deck.shuffle();
	}

	openCloseDialog(type,open){
		
		switch(type){
			case 'ScoreCard':
				this.setState({scoreCardDialogOpen: open});
			break;
			case 'Bid':
				this.setState({bidDialogOpen: open});
			break;
			case 'Quit':
				this.setState({quitGameDialogOpen: open});
			break;
			case 'cardSelection':
				this.setState({cardSelectionDialogOpen: open});
			break;
			case 'waitingLoadMask':
				open ? document.getElementById('waitingLoadMask').style.display = "" : document.getElementById('waitingLoadMask').style.display = "none";
			break;
			case 'snackBar':
				this.setState({snackBarOpen: open.open, snackBarMessage: open.message});
			break;
		}
	
	}
		
	dealCardsForPlayer(){
		var SouthContainer = document.getElementsByClassName('SouthContainer') ? document.getElementsByClassName('SouthContainer')[0] : null;
		var southAvatar = document.getElementsByClassName('SouthAvatar') ? document.getElementsByClassName('SouthAvatar')[0] : null;
		
		var discardContainer = document.getElementById('rightCardContainer') ? document.getElementsByClassName('rightCardContainer') : null;
		
		var context = this;
		var randomVar = 10;
		var cards = context.state.selectedCards;
		var counter=0;
		
		
		
		for(var index=0;index<cards.length;index++){
			var card = cards[index];
			counter = counter + 30;
			context.cardAnimateTo(
				card,
				{
					x: southAvatar.getBoundingClientRect().x-100+counter-(window.innerWidth/2) ,
					y: SouthContainer.getBoundingClientRect().top-(window.innerHeight/2),
					onComplete: context.onCompleteCardDealingCurrentPlayer(card,randomVar,{x:southAvatar.getBoundingClientRect().x-100+counter-(window.innerWidth/2),y:SouthContainer.getBoundingClientRect().top-(window.innerHeight/2)}),
					randVar: randomVar
				}
			);
		}
	
			
	}
	
	setBid(num){
		//this.state.bidValue is the entered bid.
		this.openCloseDialog('Bid',false);
		
		//emit message to let others know of the bid.
		//also emit the bid message.
		var temp={
			gameId: this.props.GameInfo.id,
			playerId: this.playerId,
			currentSelectedCards: this.state.selectedCards,
			type: 'init',
			bid: document.getElementById('num').value
		}
		this.emitSocketMessage('gameUpdate',JSON.stringify(temp));
		this.openCloseDialog('waitingLoadMask',true);
	}
	
	emitSocketMessage(event,message){
		this.socket = socketIOClient(this.endpoint);
		
		this.socket.emit(event,message);
	}
	
	cardAnimateTo(card,Obj){
		card.animateTo({
			delay: 1000 + Obj.randVar, // wait 1 second + i * 2 ms
			duration: 2000 + Obj.randVar,
			ease: 'quartOut',
			
			x: Obj.x,
			y: Obj.y,
			rot: Obj.rot ? Obj.rot : 0,
			onComplete: Obj.onComplete ? Obj.onComplete : null
		});
	}
	
	onAvatarClick(){
		//retrieve information.
	}
	
	onQuitGame(){
		this.openCloseDialog('Quit',false);
		this.props.history.push('/home');
		//move to homepage and give a penalty of 100 coins.
		
		if(this.props.GameInfo.gameReady)
		{
			// no penalty as game did not start.
			this.finishGame(true);
		}
		else{
			// no penalty as game did not start.
			this.finishGame(true);
		}
		
		//send a quit to all others as well.
		
		//end the game for everyone.
		//emit end message.
	}
	
	finishGame(properEnd){
		var temp={
			gameId: this.props.GameInfo.id,
			playerId: this.playerId,
			auditLogs: this.state.gameLog,
			type: 'deleteGame'
		}
		this.emitSocketMessage('gameUpdate',JSON.stringify(temp));
	}
	
	/**
	 * This function opens/closes the floating menu on the bottom left corner.
	 */
    openCloseFloatingMenu() {
        var menuItems = document.getElementsByClassName('toggleOptionsMenuItems');
        var floatingToggleButton = document.getElementById("floatingToggleButton");
        var buttonElement = document.getElementById("collapsibleFloatingButton");
        var len = menuItems.length;
        var translate = 50; // as the 1st menu button should be little more higher than the spacing between the buttons.

        if (floatingToggleButton.classList.contains('fa-caret-up')) {
            floatingToggleButton.classList.remove('fa-caret-up');
            floatingToggleButton.classList.add('fa-caret-down');
            floatingToggleButton.style.margin = "2px 0px 0px 0px";
        }
        else {
            floatingToggleButton.classList.remove('fa-caret-down');
            floatingToggleButton.classList.add('fa-caret-up');
            floatingToggleButton.style.margin = "-2px 0px 0px 0px";
        }

        if (this.state.menuOpen) {
            for (var i = 0; i < len; i++) {
                menuItems[i].style.transform = '';
            }

            this.setState({ menuOpen: false });
        }
        else {
            for (var j = 0; j < len; j++) {
                menuItems[j].style.transform = 'translate(0px,' + translate + 'px)';
                translate = translate + 50;
            }

            this.setState({ menuOpen: true });
        }
    }
	
	onCompleteCardDealingOthers(card,index,randomVar){
		//hide the cards of others.
		setTimeout(function(){ card.$el.style.display = "none"; }, 3000 + randomVar);
	}
	
	checkIfSecondUserCanPlayCard(card){
		var context = this;
		var playedCardSuit = context.props.GameInfo.player1Card ? context.props.GameInfo.player1Card[1] : context.props.GameInfo.player2Card[1];
		var allowed = true;
		
		
		context.deck.cards.forEach(function(deckCard,i){
			//check if played card suit is similar to one in your deck.
			if(context.suitTranslation[deckCard.suit] == playedCardSuit && deckCard.$el.style.display == "")
			{
				allowed = false;
			}
		});
		
		return allowed;
	}
	
	onCompleteCardDealingCurrentPlayer(card,randomVar,position){
		setTimeout(function(){ card.setSide('front'); }, 3000 + randomVar);
		var context = this;
		card.$el.addEventListener('mouseenter', onMouseEnter);
		card.$el.addEventListener('mouseleave', onMouseLeave);
		card.$el.addEventListener('mousedown', onClickCard);

		function onMouseEnter(){
			card.animateTo({
				delay: 200,
				duration: 1000,
				ease: 'quartOut',
				
				x: position.x,
				y: position.y-20
			});
		}
		
		function onMouseLeave(){
			card.animateTo({
				delay: 200,
				duration: 1000,
				ease: 'quartOut',
				
				x: position.x,
				y: position.y
			});
		}
		
		function onClickCard(){
			var forceSpades = false;
				
			//Spades play!
			if(!context.props.GameInfo.spadesAllowed && card.suit == 0)
			{
				//if player has no other cards left
				//then spades play is allowed.
				var playerOnlyHasSpades=true;
				context.deck.cards.forEach(function(deckCard,i){
					//check if played card suit is similar to one in your deck.
					if(context.suitTranslation[deckCard.suit] != "S" && deckCard.$el.style.display == "")
					{
						playerOnlyHasSpades = false;
					}
				});
				
				if(playerOnlyHasSpades){
					forceSpades = true;
				}
				else{
				
					//meaning this is the first card played
					//if(document.getElementById('rightCardImg').style.display == "none" && document.getElementById('leftCardImg').style.display == "none")
					if(context.props.GameInfo.cardsPlayed == 0)
					{
						context.openCloseDialog('snackBar',{open:true,message:'Cannot Play A Spades until the break'});
						return;
					}
				}
			}
		
		
			//Meaning second cards suit is not same as user chosen card.
			if(context.props.GameInfo.cardsPlayed == 1)
			{
				var playedCardSuit = context.props.GameInfo.player1Card ? context.props.GameInfo.player1Card[1] : context.props.GameInfo.player2Card[1];
				var allowed = context.checkIfSecondUserCanPlayCard(card); //this checks whether the player has a card of same suit that was played by user 1 in his deck.
				if(!allowed  && context.suitTranslation[card.suit] != playedCardSuit)
				{
					context.openCloseDialog('snackBar',{open:true,message:'You have a card of ' + playedCardSuit + " suit. Please Play That!"});
					return;
				}
			}
		
			card.$el.style.display ="none";
			var temp={
					gameId: context.props.GameInfo.id,
					playerId: context.playerId,
					type: 'cardPlayed',
					cardId: context.rankTranslation[card.rank] + context.suitTranslation[card.suit] + ".png",
					suit: card.suit,
					rank: card.rank,
					forceSpades: forceSpades
			};
			context.emitSocketMessage('gameUpdate',JSON.stringify(temp));
			
			//show waiting loadmask. 
			context.openCloseDialog('waitingLoadMask',true);
		}
	}
	
	onCardSelect(){
		var cardSelectionImg = document.getElementById('cardSelectionImg');
		var nextCardIndex = this.state.currentSelectionCardIndex + 2 ; //on selection I will discard the next one and give the user a selection of + 2 position card.
		var discardCardIndex = this.state.currentSelectionCardIndex + 1 ; 
		var cardSelectionLabel = document.getElementById('cardSelectionLabel');
		var discardButton = document.getElementById('discardButton');
		var selectButton = document.getElementById('selectButton');
		
		this.deck.cards[discardCardIndex].$el.style.display="none";
		this.deck.cards[discardCardIndex].$el.classList.add("discardNotSelected");
			
		
		if(this.state.selectedCards.length < 13)
		{
			this.state.selectedCards.push(this.deck.cards[this.state.currentSelectionCardIndex]);
			this.setState({selectedCards: this.state.selectedCards , currentSelectionCardIndex: nextCardIndex});
			cardSelectionImg.src = require("./img/" + this.rankTranslation[this.deck.cards[discardCardIndex].rank] + this.suitTranslation[this.deck.cards[discardCardIndex].suit] + ".png");
			cardSelectionLabel.innerHTML = "You skipped this card!";
			
			discardButton.style.display="none";
			selectButton.style.display="none";
			var context = this;
			
			if(this.state.selectedCards.length < 13)
			{
				setTimeout(function(){ 
						cardSelectionLabel.innerHTML = "Please Choose!";
						discardButton.style.display="";
						selectButton.style.display="";
						cardSelectionImg.src = require("./img/" + context.rankTranslation[context.deck.cards[nextCardIndex].rank] + context.suitTranslation[context.deck.cards[nextCardIndex].suit] + ".png");
				}, 1000);
			}
			else{
				//card Selections done!
				this.endSelectionPhase();
			}
			
		}
		else{
			this.endSelectionPhase();
		}
	}
	
	onCardDiscard(){
		var cardSelectionImg = document.getElementById('cardSelectionImg');
		
		var nextCardIndex = this.state.currentSelectionCardIndex + 2;
		var discardCardIndex = this.state.currentSelectionCardIndex ; 
		
		var cardSelectionLabel = document.getElementById('cardSelectionLabel');
		var discardButton = document.getElementById('discardButton');
		var selectButton = document.getElementById('selectButton');
		
		this.deck.cards[discardCardIndex].$el.style.display="none";
		this.deck.cards[discardCardIndex].$el.classList.add("discardNotSelected");
			
		
		if(this.state.selectedCards.length < 13)
		{
			
			
			this.state.selectedCards.push(this.deck.cards[discardCardIndex+1]);
			this.setState({selectedCards: this.state.selectedCards , currentSelectionCardIndex: nextCardIndex});
			
			
			cardSelectionLabel.innerHTML = "You got this card!";
			
			discardButton.style.display="none";
			selectButton.style.display="none";
			cardSelectionImg.src = require("./img/" + this.rankTranslation[this.deck.cards[discardCardIndex+1].rank] + this.suitTranslation[this.deck.cards[discardCardIndex+1].suit] + ".png");
			var context = this;
			
			if(this.state.selectedCards.length < 13)
			{
				setTimeout(function(){ 
						cardSelectionLabel.innerHTML = "Please Choose!";
						discardButton.style.display="";
						selectButton.style.display="";
						cardSelectionImg.src = require("./img/" + context.rankTranslation[context.deck.cards[nextCardIndex].rank] + context.suitTranslation[context.deck.cards[nextCardIndex].suit] + ".png");
				}, 1000);
			}
			else{
				//card Selections done!
				this.endSelectionPhase();
			}
			
		}
		else{
			this.endSelectionPhase();
		}
	}
	
	endSelectionPhase(){
		//card Selections done!
			this.openCloseDialog('cardSelection',false);
			this.setState({currentSelectionCardIndex: 0});
			this.dealCardsForPlayer();
			console.log(this.state.selectedCards);
			this.openCloseDialog('Bid',true);
	}
	
	render() {
		hideSplashScreen();
		var context=this;
		var oldGame = null;
		var rounds = this.props.GameInfo.roundsHistory;
		
		if(rounds && rounds.length > 0)
		{
			oldGame = rounds[rounds.length-1].gameObj;
		}
		
		return (
		  <div className="Board">
			
			<div id="container" style={{width: 'auto',height: 'auto'}}/>
			{/* LOAD MASKS!*/}
			<div 
				id="waitingLoadMask"
				style = {{ 
					position: "fixed",
					width: "100%",
					height: "100%",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(0,0,0,.5)",
					zIndex: 12,
					//display: (this.props.GameInfo.gameReady ? (this.props.GameInfo.round.turn == this.props.CurrentPlayerInfo.playerId ? "none" : "") : "none")
					display: "none",
					textAlign: 'center',
					alignItems: 'center',
				}}
			>
				<h3><label style={{color:'white'}}>PLEASE WAIT FOR YOUR TURN. </label></h3>
			</div>
			
			
			<div 
				style = {{ 
					position: "fixed",
					width: "100%",
					height: "100%",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(0,0,0,.5)",
					zIndex: 5,
					display: (this.props.GameInfo.gameReady ? "none" : "") 
				}}
			>
						<ComponentLoadMask bgColor="a" message="Please wait while other players join."/>
			</div>
			
			 <Snackbar
				  open={this.state.snackBarOpen}
				  message={this.state.snackBarMessage}
				  autoHideDuration={5000}
				  onRequestClose={() => this.openCloseDialog('snackBar',{open:false,message:""})}
				/>
			
			{/*OUTER CONTAINER*/}
			<Flexbox className="OuterContainer" flexDirection="column" minHeight="100vh">
			  
				{/*NORTH PLAYER*/}
				<Flexbox className="NorthOuterContainer" flexDirection="column" element="header" flexGrow={1} style={flexCenter}>
				
					<ListItem
					  leftAvatar={<Avatar className="NorthAvatar">{this.props.GameInfo.gameReady ? (this.props.CurrentPlayerInfo.playerId == 1 ? this.props.GameInfo.players[2].uname[0] : this.props.GameInfo.players[1].uname[0] ) : "?"}</Avatar>}
					>
						{this.props.GameInfo.gameReady ? (this.props.CurrentPlayerInfo.playerId == 1 ? this.props.GameInfo.players[2].uname : this.props.GameInfo.players[1].uname ) : "?"}
						<br/>
						{this.props.GameInfo.gameReady ? (this.props.CurrentPlayerInfo.playerId == 1 ? this.props.GameInfo.players[2].currentHands +"/"+ this.props.GameInfo.players[2].currentBid : this.props.GameInfo.players[1].currentHands +"/"+  this.props.GameInfo.players[1].currentBid ) : "?"}
					</ListItem>
				
				</Flexbox>
			 
				{/*CENTERAL INNER CONTAINER*/}
				<Flexbox flexGrow={5} className="CentralOuterContainer" flexDirection="row" style={{alignItems: 'center'}}>
				  
					{/*WEST PLAYER*/}
					<Flexbox flexGrow={2} flexDirection="row" className="WestContainer">
						<TextField
						  id="auditTextField"
						  value={this.state.gameLog}
						  floatingLabelText="Audit Log of Moves Played!"
						  multiLine={true}
						  rows={10}
						  rowsMax={10}
						/>
					</Flexbox>
				 
					{/*CARD AREA*/}
					<Flexbox 
						id="CardPlayArea" 
						flexGrow={4} 
						className="CardContainer" 
						flexDirection="row"  
						style={{
							alignItems: 'center', 
							border:'1px solid black',
							height: '100%'
						}}
					>
						
						<div
							id="leftCardContainer"
							style={{
								width: '50%',
								alignItems: 'center',
								height: '100%'
							}}
						> 
						<h2> Please Select A Card To Play By Clicking On It. </h2>
						<img id="leftCardImg" style={{display:'none',width: "4.875rem", height: "6.5rem"}}/> 
						</div>
						
						<div 
							id="rightCardContainer"
							style={{
								width: '50%',
								alignItems: 'center',
								height: '100%'
							}}
						>
							<img id="rightCardImg" style={{display:'none',width: "4.875rem", height: "6.5rem"}}/>
						</div>
					</Flexbox>
				 
					{/*EAST PLAYER*/}
					<Flexbox flexGrow={2} className="EastContainer">
					</Flexbox>
				</Flexbox>
			 
 				{/*SOUTH PLAYER i.e. YOU*/}
				<Flexbox element="footer" flexDirection="column" flexGrow={3} className="SouthContainer" style={flexCenter}>
					{/* empty space */}
					<Flexbox flexGrow={10} />
					<ListItem
					  leftAvatar={<Avatar className="SouthAvatar">{this.props.UserInfo.infoDetails.name[0]}</Avatar>}
					>
						{this.props.UserInfo.infoDetails.name}
						<br/>
						{this.props.GameInfo.players[this.playerId].currentHands +"/"+ this.props.GameInfo.players[this.playerId].currentBid}
					</ListItem>
				</Flexbox>
			</Flexbox>
			
			{/* Score Dialog */}
			<Dialog
			  title={this.state.gameFinished ? this.state.gameResult : "ScoreCard"}
			  autoScrollBodyContent={true}
			  actions = {[
					  <RaisedButton
						label="Okay"
						style={this.state.gameFinished ? {display: "" } : {display: "none" }}
						primary={true}
						onClick={() => this.props.history.push("/home")}
					  />
			  ]}
			  modal={this.state.gameFinished}
			  style={{
				  zIndex: 1505
			  }}
			  open={this.state.scoreCardDialogOpen}
			  onRequestClose={() => this.openCloseDialog('ScoreCard',false)}
			>
			    <Table
					selectable={false}
				>
					<TableHeader
						displaySelectAll={false}
						adjustForCheckbox={false}
					>
					  <TableRow>
						<TableHeaderColumn></TableHeaderColumn>
						<TableHeaderColumn>{this.props.GameInfo.gameReady ? (this.props.GameInfo.players[1].uname) : "?"}</TableHeaderColumn>
						<TableHeaderColumn>{this.props.GameInfo.gameReady ? (this.props.GameInfo.players[2].uname) : "?"}</TableHeaderColumn>
					  </TableRow>
					
					</TableHeader>
					
					<TableBody
						displayRowCheckbox={false}
						stripedRows={true}
					>
					  <TableRow>
						<TableRowColumn>Current Round Bid</TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[1].currentBid  : "?") : "?"}</TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[2].currentBid : "?") : "?"}</TableRowColumn>
					  </TableRow>
					  <TableRow>
						<TableRowColumn>Tricks Taken</TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[1].currentHands : "?") : "?"}</TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[2].currentHands : "?") : "?"}</TableRowColumn>
					  </TableRow>
					  <TableRow>
						<TableRowColumn></TableRowColumn>
						<TableRowColumn><b>SCORING</b></TableRowColumn>
						<TableRowColumn></TableRowColumn>
					  </TableRow>
					  <TableRow>
						<TableRowColumn>Bags Score</TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[1].totalBags : "?") : "?"}</TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[2].totalBags : "?") : "?"}</TableRowColumn>
					  </TableRow>
					  <TableRow>
						<TableRowColumn><b>Points This Round</b></TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[1].currentScore : "?") : "?"}</TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[2].currentScore : "?") : "?"}</TableRowColumn>
					  </TableRow>
					  <TableRow>
						<TableRowColumn><b>Total Points</b></TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[1].totalScore : "?") : "?"}</TableRowColumn>
						<TableRowColumn>{this.props.GameInfo.gameReady ? (oldGame ? oldGame.players[2].totalScore : "?") : "?"}</TableRowColumn>
					  </TableRow>
					</TableBody>
				</Table>
				<br />
				
				
				
			</Dialog>
			
			
			{/* Bid Dialog */}
			<Dialog
			  title="Bid"
			  modal={true}
			  open={this.state.bidDialogOpen}
			  onRequestClose={() => this.openCloseDialog('Bid',false)}
			>
			Please Enter a number between 0-13 <br />
			  <NumberInput
				id="num"
				value={this.state.bidValue}
				required
				min={0}
				max={13}
				strategy="warn"
				errorText={this.state.bidErrorText}
				/>
				<br />
				<RaisedButton label="Bid" onClick={this.setBid.bind(this)} primary={true}/>
			</Dialog>
			
			
			<Dialog
			  title="Are you sure?"
			  actions = {[
					  <RaisedButton
						label="Cancel"
						primary={true}
						onClick={() => this.openCloseDialog('Quit',false)}
					  />,
					  <RaisedButton
						label="Quit"
						primary={true}
						onClick={this.onQuitGame.bind(this)}
					  />,
			  ]}
			  modal={true}
			  open={this.state.quitGameDialogOpen}
			  onRequestClose={() => this.openCloseDialog('Quit',false)}
			>
				If you quit the game then you will receive a ban of <b><u>100 coins</u></b>. Are you sure you want to quit?
			</Dialog>
			
			{/* Main Floating Button */}
                <FloatingActionButton 
                    id = "collapsibleFloatingButton"
                    style = {{
                        top: '5px',
                        left: '5px',
                        position: 'absolute',
                        zIndex: '10',
                    }} 
                    mini = { true }
                    onClick = { this.openCloseFloatingMenu.bind(this) }
                >
                    <i 
                        id = "floatingToggleButton" 
                        className = "fa fa-caret-down" 
                        style = {{
                            fontSize: '1.8em',
                            margin: "2px 0px 0px 0px"
                        }}
                    /> 
                </FloatingActionButton>

                {/* Mini Floating Buttons */}
					
					{/* This button opens the scorecard. */}
				<FloatingActionButton 
                   style = { styles.floatingMiniStyles } 
                    className = "toggleOptionsMenuItems"
                    mini = { true }
                    onClick = {() => this.openCloseDialog('ScoreCard',true) }
                >
                    <i className = "fa fa-table" style = {{ fontSize: '1rem'}} />
                </FloatingActionButton>
					
					
					{/* This button cancels the game and exits. */}
                <FloatingActionButton 
                   style = { styles.floatingMiniStyles } 
                    className = "toggleOptionsMenuItems"
                    mini = { true }
                    onClick = {() => this.openCloseDialog('Quit',true) }
                >
                    <i className = "fa fa-times" style = {{ fontSize: '1rem'}} />
                </FloatingActionButton>
				
				
				<Dialog
				  title="Card Selection"
				  actions = {[
						  <RaisedButton
							label="Discard"
							id="discardButton"
							primary={true}
							onClick={this.onCardDiscard.bind(this)}
						  />,
						  <RaisedButton
							label="Select"
							id="selectButton"
							primary={true}
							onClick={this.onCardSelect.bind(this)}
						  />,
				  ]}
				  modal={true}
				  contentStyle = {{ width:'50%', maxWidth: "none" }}
				  open={this.state.cardSelectionDialogOpen}
				  onRequestClose={() => this.openCloseDialog('cardSelection',false)}
				>
					<div id="cardSelectionContainer" style = {{ textAlign: "center" }}>
						<label id="cardSelectionLabel" > Please Choose! </label> <br/>
						<img id="cardSelectionImg" style={{width: "3.875rem", height: "5.5rem"}} />
					</div>
				</Dialog>
			
		  </div>
		);
  }
}


/**
 * Local styling
 **/
const styles = {
	floatingMiniStyles: {
		top: '5px',
		left: "5px",
		position: 'absolute',
		zIndex: '5',
        transition: '0.5s'
	}
};

/**
 * Constants defined to make dispatching for the redux store consistent
 **/
export const saveGameInfo = (gameInfo) => ({
    type: 'SAVE_GAME_INFO',
    gameInfo
});
/**
 * Maps portions of the store to props of your choosing
 * @param state: passed down through react-redux's 'connect'
 **/
const mapStateToProps = function(state){
  return {
	  UserInfo: state.globalObject.UserInfo,
	  GameInfo: state.globalObject.GameInfo,
	  CurrentPlayerInfo: state.globalObject.CurrentPlayerInfo
  }
}

export default withRouter(connect(mapStateToProps,null,null,{withRef:true})(GamePlayBoard));
