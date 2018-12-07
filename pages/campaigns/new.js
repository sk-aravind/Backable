import React, { Component, Fragment } from "react";
import { Form, Button, Input, Message } from "semantic-ui-react";

import factory from "../../ethereum/factory";
import web3 from "../../ethereum/web3";
import { Router } from "../../src/routes";
import CampaignFactory from "../../ethereum/build/CampaignFactory.json";

class CampaignNew extends Component {
  state = {
    minimumContribution: '',
    campaignName: '',
    campaignAddress:'',
    campaignSubHeader:'',
    creatorName:'',
    endDate:'',
    campaignerAddress:'',
    campaignDetails: '',
    campaignTarget: '',
    tags:'',
    selectedfile: null,
    image: null,
    errorMessage: '',
    loading: false,
    data_eth_conv_rate: 0,
    value: "",
    conv_value: ""
  };

  componentDidMount() {
    fetch("https://api.coinmarketcap.com/v2/ticker/1027/?convert=SGD", {
      method: "GET"
    })
      .then(response => response.json())
      .then(data => {
        this.setState({
          data_eth_conv_rate: data["data"]["quotes"]["SGD"]["price"]
          // conv_value : toString(parseFloat(value)/data_eth_conv_rate) ,
        });
      });
    factory.events.returnCampaignAddress ({
    }, function(error, event){})
      .on('data',(event) => {
        this.setState({campaignAddress: event['returnValues']['_address']});
        console.log("print,", this.state.campaignAddress)
        //console.log("calling...",event['returnValues']['_address']);
      });
  }

  calculateEther(val) {
    var val_in_ether;
    if (val == "") {
      val_in_ether = 0;
    } 
    else {
      val_in_ether =
        parseFloat(val) / this.state.data_eth_conv_rate;
    }
    return val_in_ether;
  }



  onSubmit = async event => {
    event.preventDefault();

    this.setState({ loading: true, errorMessage: "" });

    try {
      const accounts = await web3.eth.getAccounts();
      const result = await factory.methods
        .createCampaign(this.calculateEther(this.state.minimumContribution))
        .send({
          from: accounts[0]
        });

      const formData = new FormData();
      formData.append('title',this.state.campaignName);
      formData.append('campaign_address',this.state.campaignAddress);
      formData.append('description',this.state.campaignDetails);
      formData.append('goal',this.calculateEther(this.state.campaignTarget));
      formData.append('image',this.state.selectedFile);
      formData.append('tags',this.state.tags);
      formData.append('end_date',this.state.endDate);
      formData.append('campaign_subheader',this.state.campaignSubHeader);
      formData.append('creator_name',this.state.creatorName);
      formData.append('campaigner_address',accounts[0]);
      for (var pair of formData.entries()) {
          console.log(pair[0]+ ', ' + pair[1]); 
      }
      // PUT call to Database
      const url = "https://backable-db.herokuapp.com/api/v1/new-campaign-submit/";
      fetch(url, {
        method: "PUT",
        body: formData
      })
      Router.pushRoute('/campaigns/' + this.state.campaignAddress);
    } catch (err) {
      this.setState({ errorMessage: err.message });
    }

    this.setState({ loading: false });
  };

  fileChangedHandler = (event) => {
    this.setState({selectedFile: event.target.files[0]})
    if (event.target.files && event.target.files[0]) {
            let reader = new FileReader();
            reader.onload = (e) => {
                this.setState({image: e.target.result});
            };
            reader.readAsDataURL(event.target.files[0]);
        }
  }

  render() {
    return (
      <Fragment>
        <h3>Create a Campaign</h3>

        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
          
          <Form.Field>
            <label>Campaigner Name</label>
            <Input
              value={this.state.creatorName}
              onChange={event =>
                this.setState({ creatorName: event.target.value })
              }
            />
          </Form.Field>

          <Form.Field>
            <label>Campaign Name</label>
            <Input
              value={this.state.campaignName}
              onChange={event =>
                this.setState({ campaignName: event.target.value })
              }
            />
          </Form.Field>

          <Form.Field>
            <label>Campaign Sub Header</label>
            <Input
              value={this.state.campaignSubHeader}
              onChange={event =>
                this.setState({ campaignSubHeader: event.target.value })
              }
            />
          </Form.Field>

          <Form.Field>
            <label>Campaign End Date</label>
            <Input
              value={this.state.endDate}
              onChange={event =>
                this.setState({ endDate: event.target.value })
              }
            />
          </Form.Field>

          <Form.Field>
            <label>Campaign Photo</label>
            <Input 
            type="file" onChange={this.fileChangedHandler.bind(this)}
            />
            <img id="target" src={this.state.image}/>
          </Form.Field>

          <Form.Field>
            <label>Campaign Details</label>
            <textarea
              value={this.state.campaignDetails}
              onChange={event =>
                this.setState({ campaignDetails: event.target.value })
              }
            />
          </Form.Field>

          <Form.Field>
            <label>Tags</label>
            <Input
              value={this.state.tags}
              onChange={event =>
                this.setState({ tags: event.target.value })
              }
            />
          </Form.Field>

          <Form.Field>
            <label>Campaign Target</label>
            <Input
              value={this.state.campaignTarget}
              onChange={event =>
                this.setState({ campaignTarget: event.target.value })
              }
              label="SGD"
              labelPosition="right"
            />
          </Form.Field>
          <p>Converts to {this.calculateEther(this.state.campaignTarget).toFixed(6)} ETH</p>


          <Form.Field>
            <label>Minimum Contribution</label>
            <Input
              label="SGD"
              labelPosition="right"
              value={this.state.minimumContribution}
              onChange={event =>
                this.setState({ minimumContribution: event.target.value })
              }
            />
          </Form.Field>
          <p>Converts to {this.calculateEther(this.state.minimumContribution).toFixed(6)} ETH</p>

          <Message error header="Oops!" content={this.state.errorMessage} />
          <Button loading={this.state.loading} primary>
            Create!
          </Button>
        </Form>
      </Fragment>
    );
  }
}

export default CampaignNew;
