import React, {Component} from "react";
import {SelectList} from "./Components";
import {API, graphqlOperation, I18n} from "aws-amplify";
import {Button} from "react-native-elements";
import * as queries from "./graphql/queries"

class SelectAddress extends Component {
    static navigationOptions = ({navigation, screenProps}) => ({
        title: navigation.getParam("label") || I18n.get('Select address'),
        headerRight: () => (
            <Button
                containerStyle={{marginEnd: 10}}
                onPress={() => {
                    navigation.navigate('AddAddress', {
                        companyOwner: navigation.getParam("companyOwner")
                    })
                }}
                title={I18n.get("New")}
            />
        )
    });

    constructor(props) {
        super(props);
        this.state = {
            onSelect: props.navigation.getParam("onSelect"),
            addresses: []
        };
        this.navigationEventSubscription = this.props.navigation.addListener(
            'willFocus',
            payload => {
                this.componentDidMount();
            }
        );
    }

    render() {
        return (
            <SelectList data={this.state.addresses}
                        onSelect={(dataItem) => this.selectAddress(dataItem.item)}
                        emptyLabel={I18n.get("No addresses. Ask your company to add new addresses through the portal.")}
                        renderTitle={(address) => address.item.name}
                        renderSubtitle={(address=> `${address.item.address}${!!address.item.city && ` · ${address.item.city}`}`)}
            />
        )
    }

    selectAddress(address) {
        this.state.onSelect(address);
        this.props.navigation.goBack();
    }

    async componentDidMount() {
        this.setState({
            loading: true
        });
        const companyOwner = this.props.navigation.getParam("companyOwner");
        const response = await API.graphql(graphqlOperation(queries.contactByOwner, {
            limit: 50,
            owner: companyOwner,
            sortDirection: "ASC"
        }));
        this.setState({
            addresses: response.data.contactByOwner.items,
            loading: false
        });
    }

    componentWillUnmount() {
        this.navigationEventSubscription.remove();
    }
}

export default SelectAddress;