import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, combineReducers } from 'redux';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import 'font-awesome/css/font-awesome.min.css';
import injectTapEventPlugin from 'react-tap-event-plugin';
import RedirectRouter from './Router.js';

import './index.css';


injectTapEventPlugin();

/**
 * The initial state of the store (prior to loading table data)
 **/
const initialStore = {
    UserInfo: {
		infoDetails:{},
		historyGamesList:[],
		userStatistics:{}
	},
	GameInfo: {},
	CurrentPlayerInfo: {},
    isUserLoggedIn: false
};


/**
 * Redux Reducer which handles all changes to the store
 * @param state: The current state of the store
 * @param action: The action that called for a change on the store
 **/
const globalReducer = function(state = initialStore, action) {
    var stateVal, previousRange, selected, display, i;
    
    switch (action.type) {
        /**
         * Initializes the Filter structure
         * @param action.storeFilterStruc: What to set the initial Filter sub-structure to
         **/
        case 'INIT':
            return {
                ...state,
                Filter: action.storeFilterStruc,
            }
		
		case 'SAVE_USER_INFO':
            return {
                ...state,
                UserInfo: action.userInfo,
				isUserLoggedIn: true
            }
			
		case 'UPDATE_GAME_INFO':
            return {
                ...state,
                Filter: action.storeFilterStruc,
            }
			
		case 'SAVE_GAME_INFO':
			return {
                ...state,
                GameInfo: action.gameInfo,
            }
			
		case 'SAVE_CURRENTPLAYER_INFO':
			return {
                ...state,
                CurrentPlayerInfo: action.CurrentPlayerInfo,
            }
			
			/*{ 
                    ...state,
                    ModalDisplay: {
                        ...state.ModalDisplay,
                        settingsModal: settingsDisplay,
                        statisticsModal: statisticsDisplay,
                        alertsModal: alertsDisplay,
                        legendModal: legendDisplay,
                        allViewsModal: allViewsDisplay,
                        helpModal: helpDisplay,
                        adminModal: adminDisplay,
                        selectedFilteredModal: selectedFilteredDisplay
                    }
                };*/
		
		
        /**
         * Shouldn't reach here unless theres a typo in the action
         **/
        default:
            console.log("TYPO IN ACTION: " + action.type);
            //debugger;
            return state;
    }
};


const dummyReducer = function(state = initialStore, action) {
  return state;
}

const reducers = combineReducers({
  globalObject: globalReducer,
  dummyState: dummyReducer
});

let store = createStore(reducers);

ReactDOM.render(<Provider store = { store }><RedirectRouter /></Provider>, document.getElementById('root'));
registerServiceWorker();
