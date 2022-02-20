import React, {Component} from "react";
import {FlatList, Image, ListView, StyleSheet, TextInput, TouchableOpacity, View} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import {MyText, SelectList} from "./Components";
import {API, Auth, graphqlOperation, I18n} from "aws-amplify";
import {Button} from "react-native-elements";
import * as customQueries from "./graphql/custom-queries"
import * as queries from "./graphql/queries"

class SelectVehicle extends Component {
    constructor(props) {
        super(props);
        this.state = {
            onSelect: props.route.params.onSelect,
            vehicleType: props.route.params.vehicleType,
            vehicles: []
        };
        const {navigation, route} = props;
        navigation.setOptions({
            title: I18n.get('Select vehicle'),
            headerRight: () => (
                <Button
                    containerStyle={{marginEnd: 10}}
                    onPress={() => {
                        navigation.navigate('AddVehicle', {
                            companyOwner: route.params.companyOwner,
                            vehicleType: route.params.vehicleType,
                        })
                    }}
                    title={I18n.get("New")}
                />
            )
        });
        this.navigationEventSubscription = this.props.navigation.addListener(
            'focus',
            payload => {
                this.componentDidMount();
            }
        );
    }

    render() {
        return (
            <View style={{flex: 1}}>
                <SelectList data={this.state.vehicles}
                            loading={this.state.loading}
                            onSelect={(dataItem) => this.selectVehicle(dataItem.item)}
                            onEdit={(dataItem) => this.editVehicle(dataItem.item)}
                            emptyLabel={I18n.get('No vehicles.')}
                            renderTitle={(vehicle) => vehicle.item.licensePlateNumber}
                            renderSubtitle={(vehicle => `${vehicle.item.type} · ${vehicle.item.description}`)}
                />
            </View>
        )
    }

    selectVehicle(vehicle) {
        this.state.onSelect(vehicle);
        this.props.navigation.goBack();
    }

    editVehicle(vehicle) {
        const {navigation, route} = this.props;
        navigation.navigate('AddVehicle', {
            companyOwner: route.params.companyOwner,
            editVehicle: vehicle
        });
    }

    async componentDidMount() {
        this.setState({
            loading: true
        });
        const companyOwner = this.props.route.params.companyOwner;
        try {
            const response = await API.graphql(graphqlOperation(queries.vehicleByOwner, {
                limit: 50,
                owner: companyOwner,
                sortDirection: "ASC"
            }));
            this.setState({
                vehicles: response.data.vehicleByOwner.items.filter(v => v.type === this.state.vehicleType),
                loading: false
            });
        } catch(ex) {
            console.warn(ex);
        }
    }

    componentWillUnmount() {
        this.navigationEventSubscription();
    }
}

const styles = StyleSheet.create({
    textInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1
    },
    baseContainer: {
        flex: 1, padding: 10
    },
});

export default SelectVehicle;