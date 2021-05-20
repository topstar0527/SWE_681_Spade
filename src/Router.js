import React from 'react'
import { connect } from 'react-redux';
import { Router, Route, Switch, Redirect, HashRouter } from 'react-router-dom';
import { checkUserLoggedIn } from './ServerCallHelper.js';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import createHistory from 'history/createBrowserHistory';
import Login from './Login.js';
import SignUp from './SignUp.js';
import HomePage from './HomePage.js';
import NotFoundPage from './NotFoundPage.js'; 
import Logout from './Logout.js';
import TableView from './Table.js';
import Maintenance from './Maintenance.js';


const browserHistory = createHistory();
var isUserLoggedIn = false;
var maintenance = false;


class ApplicationRouter extends React.Component{

  constructor (props) {
    super(props);
    var context = this;
    try {
        var res = checkUserLoggedIn(this.onServerError);
        var jsonRes = JSON.parse(res);
        var loggedIn = jsonRes ? jsonRes.isUserLoggedIn : false;
        
        if (loggedIn && jsonRes) {
            context.props.dispatch(saveUserInfo(jsonRes.UserInfo));
            isUserLoggedIn=true;
        }
    }
    catch (err) {
        // Handle error
    }
  }

  onServerError() {
      maintenance = true;
  }

  RedirectToLogin = () => (
      <Redirect to = "/login" />
  );

  LoginForm = () => (
      (maintenance ? <Redirect to = "/maintenance" /> : ( this.getLoggedInStatus() ? <Redirect to = "/home" /> : <Login/> ) )
  );
  
  SignUpView = () => (
      (maintenance ? <Redirect to = "/maintenance" /> : ( this.getLoggedInStatus() ? <Redirect to = "/home" /> : <SignUp/> ) )
  );

  HomeView = () => (
      (maintenance ? <Redirect to = "/maintenance" /> : ( this.getLoggedInStatus() ? <HomePage /> : <Redirect to = "/login" /> ) )
  );

  TableView = () => (
      (maintenance ? <Redirect to = "/maintenance" /> : ( this.getLoggedInStatus() ? <TableView /> : <Redirect to = "/login" /> ) )
  );

  LogoutView = () => (
      <Logout />
  );

  Maintenance = () => (
      (maintenance ? <Maintenance /> : <Redirect to = "/login" /> )
  );


  /**
   * We are checking both as the dispatch doesn't updates the store asynchronously and thus we have to set a flag in this class to true and check that.
   */
  getLoggedInStatus() {
      return (this.props.isUserLoggedIn || isUserLoggedIn);
  }

    render() {
        return (
            <MuiThemeProvider>
                <HashRouter >
                    <Switch>
                        <Route exact path = "/login" component = { this.LoginForm } />

                        <Route exact path = "/" component = { this.RedirectToLogin } />

                        <Route exact path = "/home" component = { this.HomeView } />

                        <Route exact path = "/game" component = { this.TableView } />
						
						<Route exact path = "/signup" component = { this.SignUpView } />

                        <Route exact path = "/logout" component = { this.LogoutView } />

                        <Route exact path = "/maintenance" component = { this.Maintenance } />

                        <Route path = "*" component = { NotFoundPage } />
                  </Switch>
              </HashRouter>
          </MuiThemeProvider>
      );
  };  
}


/**
 * Constants defined to make dispatching for the redux store consistent
 **/
export const saveUserInfo = (userInfo) => ({
    type: 'SAVE_USER_INFO',
    userInfo
});


/**
* Maps portions of the store to props of your choosing
* @param state: passed down through react-redux's 'connect'
**/
const mapStateToProps = function (state) {
    return {
        UserInfo: state.globalObject.UserInfo,
        isUserLoggedIn: state.globalObject.isUserLoggedIn
    }
}


/**
 * Connects the redux store to get access to global states.
 **/
export default connect(mapStateToProps)(ApplicationRouter);