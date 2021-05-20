import React from 'react';
import { deleteCookie, getLoginCookieName, makeServerCall } from './ServerCallHelper.js';
import { withRouter } from 'react-router';
import { hideSplashScreen, showLoadMask, hideLoadMask } from './LoadMaskHelper.js';
import Flexbox from 'flexbox-react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import IconButton from 'material-ui/IconButton';
import Snackbar from 'material-ui/Snackbar';
import Paper from 'material-ui/FontIcon';
import Dialog from 'material-ui/Dialog';
import DatePicker from 'material-ui/DatePicker';
import Toggle from 'material-ui/Toggle';

const optionsStyle = {
  maxWidth: 255,
  marginRight: 'auto',
};


class SignUp extends React.Component {
	
	state = {
      Snackbarmessage: '',
      Snackbaropen: false,
    };
      handleRequestClose = () => {
    this.setState({
      Snackbaropen: false,
    });
  };


constructor(props) {
    super(props);

    const minDate = new Date();
    const maxDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 1);
    minDate.setHours(0, 0, 0, 0);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    maxDate.setHours(0, 0, 0, 0);

    this.state = {
      minDate: minDate,
      maxDate: maxDate,
      autoOk: false,
      disableYearSelection: false,
    };
  }

  handleChangeMinDate = (event, date) => {
    this.setState({
      minDate: date,
    });
  };

  handleChangeMaxDate = (event, date) => {
    this.setState({
      maxDate: date,
    });
  };

  handleToggle = (event, toggled) => {
    this.setState({
      [event.target.name]: toggled,
    });
  };

	ValidateForm()
	{
		var error = [];
		 var ElementFocus = [];
				var dob = document.getElementById("dob").value;
                                           if(dob == "")
                                           {
                                               error.push("Please Enter Date of Birth");
                                               document.getElementById("dob").value = "";
		                                    ElementFocus.push("dob");
                                
                                
                                           }
                                           else if(!dob.match(/([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/))
                                           {
                                               error.push("Date of Birth should be of the format YYYY-MM-DD ");
                                            document.getElementById("dob").value = "";
		                                    ElementFocus.push("dob");
                                           }
               var email = document.getElementById("email").value
                                           if (email == "")
                                           {
                                               error.push("please enter Email");
                                               document.getElementById("email").value = "";
		                                       ElementFocus.push("email");
                                           }
                                           else if(!email.match(/^[\_]*([a-z0-9]+(\.|\_*)?)+@([a-z][a-z0-9\-]+(\.|\-*\.))+[a-z]{2,6}$/))
                                           {
                                               error.push("Email entered is not valid ");
                                               document.getElementById("email").value = "";
		                                       ElementFocus.push("email");
                                               
                                              
                                           }
                var password = document.getElementById("password").value
                                           if (password == "")
                                           {
                                               error.push("please enter password");
                                               document.getElementById("password").value = "";
		                                       ElementFocus.push("password");
                                           }
                                           else if(!password.match(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/))
                                           {
                                               error.push("password entered is not valid ");
                                               document.getElementById("password").value = "";
		                                       ElementFocus.push("password");
                                               
                                              
                                           }
                 var username = document.getElementById("username").value
                                           if (username == "")
                                           {
                                               error.push("please enter username");
                                               document.getElementById("username").value = "";
		                                       ElementFocus.push("username");
                                           }
                                           else if(!username.match(/^[a-zA-Z]+$/))
                                           {
                                               error.push("username entered is not valid ");
                                               document.getElementById("username").value = "";
		                                       ElementFocus.push("username");
                                               
                                              
                                           }

		
		
		if(error.length > 0){
			var err = '';
			error.forEach(
			function(error) {
					err += error + ',';
					}

			);
			this.setState({Snackbarmessage: err, Snackbaropen: true});
		}
		else{
			var context = this;
			var url = 'registerUser?uname='+username+"&password="+password+"&email="+email+"&dob="+dob;
			makeServerCall(url, function(response, options){
				
				var result; 
			
				try {
					result = JSON.parse(response);
				}
				catch(e) {
					result = null;
				}
				
				if(result.status == "success")
				{
					context.props.history.push('/login');
				}
				else{
					context.setState({Snackbarmessage: "Something went wrong! Please Try again Later!", Snackbaropen: true});
				}
				
			});
		}
        
	}
    render() {
        hideSplashScreen();

        return(
        	<div>
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
                    <div className="imgcontainer123" style = {{ height:"50px", fontSize: '18px', textAlign: "center" }} >
						<img src="./img/spade.png" alt="Avatar" className="avatar" width="50px" height="50px"/>
                    </div>
					
					
					<div style = {{ textAlign: "center" }} >
						<TextField
						  id='username'
						  hintText="Username Field"
						  floatingLabelText="Name"
						  fullWidth={true}
						  required
						/><br />
						 <TextField
						  id='password'
						  hintText="len: 6-16, 1 num, 1 char, 1 [!@#$%^&*]"
						  floatingLabelText="Password"
						  type="password"
						  fullWidth={true}
						  required
						/><br /> 
						<TextField
						  id='email'
						  hintText="lee@example.com"
						  floatingLabelText="Email (this is your username)"
						  fullWidth={true}
						  required
						/><br />

							   
							        <div style={optionsStyle}>
							          <DatePicker
							          id='dob'
							            onChange={this.handleChangeMinDate}
							            autoOk={this.state.autoOk}
							            floatingLabelText="Date Of Birth"
							            fullWidth={true}
							            hintText="YYYY-MM-DD"
							           // defaultDate={this.state.minDate}
							            disableYearSelection={this.state.disableYearSelection}
							            required
							          />
							         
							   
							        </div>
							      

                    </div>
					
					<div className="imgcontainer123" style = {{ height:"30px", fontSize: '18px', textAlign: "center" }} >
						
                    </div>
					
					<Flexbox className="ButtonContainer" flexDirection="row">
							<RaisedButton label="Sign Up" primary={true} onClick={this.ValidateForm.bind(this)} fullWidth={true}/>
					</Flexbox>
					
					<div className="imgcontainer123" style = {{ height:"10px", fontSize: '18px', textAlign: "center" }} >
						
                    </div>
                </div>  

            </Dialog>

            <Snackbar
			  open={this.state.Snackbaropen}
			  message={this.state.Snackbarmessage}
			  autoHideDuration={9999}
			  bodyStyle={{ maxWidth: 200, maxheight: 200 }}
			  onRequestClose={this.handleRequestClose}
			/>
       </div>
        );
    }
}

export default withRouter((SignUp));