import React, { Component } from 'react';
import Table from './Table.js';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import './App.css';

class App extends Component {
	
	render() {
	 
	  
		return (
		  <MuiThemeProvider>
			  <div className="App">
			  
				<Table />
				
			   </div>
		   </MuiThemeProvider>
		);
  }
}

export default App;
