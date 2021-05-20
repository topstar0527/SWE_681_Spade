import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { hideSplashScreen, showLoadMask, hideLoadMask } from './LoadMaskHelper.js';
import { makeServerCall } from './ServerCallHelper.js';
import Dialog from 'material-ui/Dialog';
import Flexbox from 'flexbox-react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Snackbar from 'material-ui/Snackbar';
import Paper from 'material-ui/FontIcon';


class Login extends React.Component {

    state = {
        loginVisible: true,
        loginButtonBottomTranslateCalc: 0,
        openForgotPasswordDialog: false,
        snackbar: false
    }


    /**
	 * React built-in which is called when component mounts
	 */
    componentDidMount1() {

        
		var context = this;
        // Add event listeners for using the enter key to login
        document.getElementById("UserText").addEventListener("keyup", this.enterKeyToLogin.bind(context));
        document.getElementById("PassText").addEventListener("keyup", this.enterKeyToLogin.bind(context));

        document.title = "SPADES - Login";
    }


    /**
	 * React built-in which is called when component unmounts
	 */
	componentWillUnmount1() {

        // Remove event listeners for using the enter key to login
        document.getElementById("UserText").removeEventListener("keyup", this.enterKeyToLogin);
        document.getElementById("PassText").removeEventListener("keyup", this.enterKeyToLogin);
	}


    /**
	 * Calls the code to login when the enter key is pressed
     * @param e: event instance which contains information about what caused the event
	 */
    enterKeyToLogin(e) {
        e.preventDefault();
        if (e.keyCode === 13) {
            this.buttonClick();
        }
    }


    /**
     * Redirects to a target path
     * @param str: target path
     **/
    navigate = (str) => {
        this.props.history.push(str);
    }


    /**
     * -ADCMT
     * @param evt: -ADCMT
     **/
    authenticate = (evt) => {
        var username = document.getElementById('UserText').value;
        var password = document.getElementById('PassText').value;
        var url = 'login?username=' + username + "&password=" + password;
        showLoadMask();
        
        var lblErrPass = document.getElementById('errPass');
        lblErrPass.innerText = "";
        lblErrPass.hidden = true;
        
        // Server call to check user/pass and update state.
        makeServerCall(url, this.onServerResponse, {onServerCallError: this.showMaintanencePage} );
    }


    /**
     * Reroutes to maintanance page (not redundant, used for "makeServerCall" in authenticate)
     **/
    showMaintanencePage = () => {
        this.navigate('/maintenance');
    };


    /**
     * -ADCMT
     * @param response: -ADCMT
     * @param options: -ADCMT
     **/
    onServerResponse = (response, options) => {
        var result; 
        
        try {
            result = JSON.parse(response);
        }
        catch(e) {
            result = null;
        }
        
        var lblErrPass = document.getElementById('errPass');

        if (result && result.status == 'success') { 
            // Save the details to store
            if (result.UserInfo) {
                result.UserInfo.loggedInTime = new Date();
                result.UserInfo.idleTime = 0;
            }

            this.saveUserInfo(result.UserInfo);
        }

        else if (result && result.status == "failed") {
            console.log('Error');
            lblErrPass.hidden = false;
            lblErrPass.innerText = "Incorrect Username/Password";
        }

        else {
            this.navigate("/maintenance");
        }

        hideLoadMask();
    }


    /**
     * -ADCMT
     * @param userInfo: -ADCMT
     * @param funnelInfo: -ADCMT
     **/
    saveUserInfo = (userInfo) => {
        console.log('Success');
        this.props.dispatch(saveUserInfo(userInfo));

        // Call function post login if provided.
        if (typeof this.props.doAfterLogin == 'function') {
            this.props.doAfterLogin(userInfo);
        }

        // Redirect to home page.
        this.navigate("/home");
    }


    onClickReset(){
		document.getElementById('UserText').value = '';
		document.getElementById('PassText').value = '';
	}

	onClickSignUp(){
		this.navigate("/signup");
	}
	
    render() {
		// Initial stuff for positioning the login button
        hideSplashScreen();
		
        return (
            <Dialog
                actions = {
                    [    ]
                }
                overlayStyle = {{ backgroundColor: 'white' }}
                contentStyle = {{ width:'30%', maxWidth: "none" }}
                modal = { true }
                open = { true }
            >   
                <div>
                    <div className="imgcontainer" style = {{ height:"50px", fontSize: '18px', textAlign: "center" }} >
						<img src="./img/spade.png" alt="Avatar" className="avatar" width="50px" height="50px"/>
                    </div>
					
					
					<div style = {{ textAlign: "center" }} >
						<TextField
						  id='UserText'
						  hintText="Username Field"
						  floatingLabelText="Username"
						  fullWidth={true}
						/><br />
						<TextField
						  id='PassText'
						  hintText="Password Field"
						  floatingLabelText="Password"
						  type="password"
						  fullWidth={true}
						/><br />
                    </div>
					
					<div className="imgcontainer" style = {{ height:"30px", fontSize: '18px', textAlign: "center" }} >
						
                    </div>
					
					<Flexbox className="ButtonContainer" flexDirection="row">
						<Flexbox flexGrow={5}>
							<RaisedButton label="Reset" secondary={true} onClick={this.onClickReset} fullWidth={true}/>
						</Flexbox>
						<Flexbox flexGrow={5}>
							<RaisedButton label="Login" primary={true}  onClick={this.authenticate.bind(this)} fullWidth={true}/>
						</Flexbox>
					</Flexbox>
					
					<div className="imgcontainer" style = {{ height:"10px", fontSize: '18px', textAlign: "center" }} >
						
                    </div>
					
					<Flexbox className="ButtonContainer" flexDirection="column">
						
						<div className="imgcontainer" style = {{ fontSize: '18px', textAlign: "center" }} >
							<a onClick={this.onClickSignUp.bind(this)} ><label id='newUserLink' style={{cursor:'pointer'}}>New User?</label></a>
						</div>
						
						<div className="imgcontainer" style = {{ height:"20px", fontSize: '18px', textAlign: "center" }} >
							<label id='errPass' style={{color:'red'}}> </label>
						</div>
						
					</Flexbox>
                </div>  
            </Dialog>
        );
    }
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
const mapStateToProps = function(state){
  return {
	  UserInfo: state.globalObject.UserInfo
  }
}


/**
 * Connects the redux store to get access to global states.
 **/
export default withRouter(connect(mapStateToProps,null,null,{withRef:true})(Login));