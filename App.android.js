import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, TextInput, Image, TouchableHighlight, Dimensions} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import AppLoading from 'expo-app-loading';
import * as Font from 'expo-font';
import Moment from 'moment';
import Pdf from './assets/images/pdf.svg';
import Chevron from './assets/images/chevron.svg';
import Marker from './assets/images/marker.svg';
import Passeport from './assets/images/passeport.svg';
import { preventScreenCaptureAsync } from 'expo-screen-capture';
import Icon from 'react-native-vector-icons/Ionicons';
import IconFA from 'react-native-vector-icons/FontAwesome5';
import Soldes from './assets/images/badge-de-reduction.png';
import TousAntiCovidScreen from './assets/images/tousAntiCovid.png';
import QRCodeTemplate from './assets/images/qrCodeTemplate.svg';
import MapView from 'react-native-maps';
import {create_pdf} from './print.js';
import * as Print from 'expo-print';
import {NavigationContainer, useNavigation} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import qrcode from "yaqrcode";
import { Camera } from 'expo-camera';
import QRCodeScan from './assets/images/qr_scanner.svg';

const api_key = "9d9faba0de2c7ce85c3ce1a4b357772a";
const api_url = "http://api.positionstack.com/v1/forward?access_key=" + api_key + "&output=json&limit=1&query=";

function create_6_months_after(date_string) {
	return Moment(date_string, 'DD/MM/YYYY').add(6, 'months').format("DD/MM/YYYY");
}

function is_valid(date_string) {
	const month_ago = Moment().subtract(6, 'months');
	const date = Moment(date_string, 'DD/MM/YYYY');
	if (date >= month_ago) {
		return "Valide";
	}
	return "Expiré";
}

const {vw, vh} = require('react-native-expo-viewport-units');
const store = {
	fontsLoaded: false,
	ville: "",
	qr_data: {},
	mapView: {},
	region: {
		latitude: 48.86887164896842,
		longitude: 2.3412042571517215,
		latitudeDelta: 0.02,
		longitudeDelta: 0.02,
	},
	scanned: false
};

const customFonts = {
	'Marianne-Regular': require('./assets/fonts/Marianne/marianne_medium.otf'),
	'Marianne-Bold': require('./assets/fonts/Marianne/marianne_bold.otf'),
	'Marianne-ExtraBold': require('./assets/fonts/Marianne/marianne_extrabold.otf'),
}
const Stack = createStackNavigator();

async function printHTML(b64, qr_data) {
	let html = create_pdf({
		qrcode: b64,
		data: qr_data
	});
	await Print.printAsync({html: html});
}

function getDataURL(qr_data) {
	let formatted_text = "NOM : " + qr_data.nom + "\n";
	formatted_text += "PRENOM : " + qr_data.prenom + "\n";
	formatted_text += "DATE DE VACCINATION : " + qr_data.vaccination_date + "\n";
	formatted_text += "DATE D'EXPIRATION : " + qr_data.expiration_date + "\n";
	formatted_text += "STATUT : " + qr_data.statut + "";
	printHTML(qrcode(formatted_text), qr_data).then();
}

function TousAntiCovid({ navigation }) {
	return (
		<View style={styles_tous.container}>
			<Image style={styles_tous.image} source={ TousAntiCovidScreen } />
			<TouchableHighlight underlayColor={'transparent'}  style={styles_tous.passeport_view} onPress={() => navigation.navigate('TousVaccines')}>
				<Passeport width={60} height={80} />
			</TouchableHighlight>
		</View>
	)
}

function passeport_vaccinal_scanner({ navigation }) {
	console.log(Object.keys(store.qr_data));
	if (Object.keys(store.qr_data).length) {

		navigation.navigate('passeport_vaccinal')
	}
	return (
		<View style={styles.container}>
			<View style={styles.chevron}>
				<TouchableHighlight underlayColor={'transparent'}  onPress={() => navigation.navigate('TousAntiCovid')}>
					<Chevron width={50} height={50}/>
				</TouchableHighlight>
			</View>

			<View style={styles.selector}>
				<View style={is_active.button_body}>
					<Text style={is_active.selector_text}>MON PASSEPORT SANTÉ</Text>
				</View>
				<View style={styles.button_body}>
					<TouchableHighlight underlayColor={'transparent'}  onPress={() => navigation.navigate('TousDehors')}>
						<Text style={styles.selector_text}>TOUS-DEHORS</Text>
					</TouchableHighlight>
				</View>
			</View>
			<LinearGradient
				// Background Linear Gradient
				colors={['rgba(183,238,211, 1)', 'rgba(40,52,116, 1)']}
				style={styles.background}
			/>
			<View style={styles.section}>
				<View style={styles.qr}>
					<TouchableHighlight underlayColor={'transparent'}  onPress={() => navigation.navigate('qr_scanner')}>
						<QRCodeTemplate width={vh(20)} height={vh(20)} />
					</TouchableHighlight>
				</View>
				<Text style={styles.info}>INFORMATIONS</Text>
				<View style={styles.list}>
					<Text style={styles.data_text_qr_template}>Veuillez scanner votre QR Code pour accéder à vos informations.</Text>
				</View>
			</View>
		</View>
	)
}

function qr_scanner({navigation}) {
	const [hasPermission, setHasPermission] = useState(null);
	const [scanned, setScanned] = useState(false);
	const navigate = navigation;

	useEffect(() => {
		(async () => {
			const { status } = await Camera.requestPermissionsAsync();
			setHasPermission(status === 'granted');
		})();
	}, []);

	const handleBarCodeScanned = ({ type, data }) => {
		setScanned(true);
		store.qr_data = to_array(data);
		navigate.navigate('passeport_vaccinal')
	};

	function format(string) {
		switch (string) {
			case "NOM":
				return "nom";
			case "PRENOM":
				return "prenom";
			case "N° DE SÉCU":
				return "numero_secu";
			case "DATE DE NAISSANCE":
				return "dob";
			case "DATE DE VACCINATION":
				return "vaccination_date";
			case "DATE D'EXPIRATION":
				return "expiration_date";
			case "STATUT":
				return "statut";
			default:
				return undefined
		}
	}

	function to_array(code) {
		code = code.split("\n");
		let new_code = {};
		code.forEach((elem) => {new_code[format(elem.split(" : ")[0])] = elem.split(" : ")[1]});
		return new_code;
	}

	if (hasPermission === null) {
		return <Text>Requesting for camera permission</Text>;
	}
	if (hasPermission === false) {
		return <Text>No access to camera</Text>;
	}
	const { width } = Dimensions.get('window')

	return (
		<Camera
			onBarCodeScanned={scanned ? undefined : handleBarCodeScanned.bind(navigation)}
			style={StyleSheet.absoluteFillObject}
			ratio={"16:9"}
		>
			<View style={{ alignItems: 'center', justifyContent: 'center'}}>
				<Text style={{fontSize: width * 0.06, marginTop: '10%', color: 'white'}}>Scannez votre code QR</Text>
				<QRCodeScan
					style={{ width: '80%', height: '80%' }}
				/>
			</View>
		</Camera>
	)
}


function passeport_vaccinal({ navigation }) {
	function data() {
		console.log(store);
		getDataURL(store.qr_data)
	}

	let formatted_text = "NOM : " + store.qr_data.nom + "\n";
	formatted_text += "PRENOM : " + store.qr_data.prenom + "\n";
	formatted_text += "DATE DE VACCINATION : " + store.qr_data.vaccination_date + "\n";
	formatted_text += "DATE D'EXPIRATION : " + store.qr_data.expiration_date + "\n";
	formatted_text += "STATUT : " + store.qr_data.statut + "";

	return (
		<View style={styles.container}>
			<View style={styles.chevron}>
				<TouchableHighlight underlayColor={'transparent'}  onPress={() => navigation.navigate('TousAntiCovid')}>
						<Chevron width={50} height={50}/>
				</TouchableHighlight>
			</View>

			<View style={styles.selector}>
				<View style={is_active.button_body}>
					<Text style={is_active.selector_text}>MON PASSEPORT SANTÉ</Text>
				</View>
				<View style={styles.button_body}>
					<TouchableHighlight underlayColor={'transparent'}  onPress={() => navigation.navigate('TousDehors')}>
						<Text style={styles.selector_text}>TOUS-DEHORS</Text>
					</TouchableHighlight>
				</View>
			</View>
			<LinearGradient
				// Background Linear Gradient
				colors={['rgba(183,238,211, 1)', 'rgba(40,52,116, 1)']}
				style={styles.background}
			/>
			<View style={styles.section}>
				<View style={styles.qr}>
					<QRCode
						value={formatted_text}
						size={vh(20)}
						backgroundColor='transparent'
					/>
				</View>
				<Text style={styles.info}>INFORMATIONS</Text>
				<View style={styles.list}>
					<Text style={styles.data_text}>NOM : {store.qr_data.nom}</Text>
					<Text style={styles.data_text}>PRENOM : {store.qr_data.prenom}</Text>
					<Text style={styles.data_text}>DATE DE NAISSANCE : {store.qr_data.dob}</Text>
					<Text style={styles.data_text}>DATE DE VACCINATION : {store.qr_data.vaccination_date}</Text>
					<Text style={styles.data_text}>N° DE SÉCU : {store.qr_data.numero_secu}</Text>
					<Text style={styles.data_text}>DATE DE D'EXPIRATION : {store.qr_data.expiration_date}</Text>
					<Text style={styles.data_text}>STATUT : {store.qr_data.statut}</Text>
				</View>
				<View style={styles.pdf}>
					<TouchableHighlight underlayColor={'transparent'}  onPress={data.bind(this)}>
						<Pdf width={50} height={50}/>
					</TouchableHighlight>
				</View>
			</View>
		</View>
	);
}


function tous_dehors({ navigation }) {
	return (
		<View style={styles.container}>
			<View style={styles.chevron}>
				<TouchableHighlight underlayColor={'transparent'}  onPress={() => navigation.navigate('TousAntiCovid')}>
					<Chevron width={50} height={50}/>
				</TouchableHighlight>
			</View>
			<View style={styles.selector}>
				<View style={styles.button_body}>
					<TouchableHighlight underlayColor={'transparent'}  onPress={() => {
						if (Object.keys(store.qr_data).length) {
							navigation.navigate('passeport_vaccinal')
						} else {
							navigation.navigate('passeport_vaccinal_scanner')
						}
					}}>
						<Text style={styles.selector_text}>MON PASSEPORT SANTÉ</Text>
					</TouchableHighlight>
				</View>
				<View style={is_active.button_body}>
					<Text style={is_active.selector_text}>TOUS-DEHORS</Text>
				</View>
			</View>
			<LinearGradient
				// Background Linear Gradient
				colors={['rgba(183,238,211, 1)', 'rgba(40,52,116, 1)']}
				style={styles.background}
			/>
			<View style={styles.section_dehors}>
				<View style={styles.searchSection}>
					<TextInput
						style={styles.input}
						placeholder="Recherche ville"
						placeholderTextColor="#D6E2E3"
						onChangeText={(text) => {store.ville = text}}
						onEndEditing={() => {
							console.log(store);
							console.log(api_url + store.ville);
							fetch(api_url + store.ville)
								.then((response) => response.json())
								.then((json) => {
									store.region.latitude = json["data"][0].latitude;
									store.region.longitude = json["data"][0].longitude;
									navigation.navigate('TousDehorsMap')
								})
						}}
						underlineColorAndroid="transparent"
					/>
					<Icon style={styles.searchIcon} name="ios-search" size={20} color="#000" onPress={() => {
						fetch(api_url + store.ville)
							.then((response) => response.json())
							.then((json) => {
								store.region.latitude = json["data"][0].latitude;
								store.region.longitude = json["data"][0].longitude;
								navigation.navigate('TousDehorsMap')
							})
					}}/>
				</View>
				<View style={styles.filtreSection}>
					<IconFA style={styles.filterIcon} name="filter" size={15} color="#000"/>
					<Text style={styles.filtre}>Filtrer</Text>
				</View>
				<View style={styles.info_search}>
					<Text style={styles.info_text}>Recherchez des commerçants partenaires pour bénéficier de réductions grâce au scan de votre QR Code ! </Text>
					<Image style={styles.soldes} source={ Soldes }/>
				</View>
				<View style={{ flex: 1 }} />
			</View>
		</View>
	);
}

function tous_dehors_map({navigation}) {
	return (
		<View style={styles.container}>
			<View style={styles.chevron}>
				<TouchableHighlight underlayColor={'transparent'}  onPress={() => navigation.navigate('TousAntiCovid')}>
					<Chevron width={50} height={50}/>
				</TouchableHighlight>
			</View>
			<View style={styles.selector}>
				<View style={styles.button_body}>
					<TouchableHighlight underlayColor={'transparent'}  onPress={() => {
						if (Object.keys(store.qr_data).length) {
							navigation.navigate('passeport_vaccinal')
						} else {
							navigation.navigate('passeport_vaccinal_scanner')
						}
					}}>
						<Text style={styles.selector_text}>MON PASSEPORT SANTÉ</Text>
					</TouchableHighlight>
				</View>
				<View style={is_active.button_body}>
					<Text style={is_active.selector_text}>TOUS-DEHORS</Text>
				</View>
			</View>
			<LinearGradient
				// Background Linear Gradient
				colors={['rgba(183,238,211, 1)', 'rgba(40,52,116, 1)']}
				style={styles.background}
			/>
			<View style={styles.section_dehors}>
				<View style={styles.searchSection}>
					<TextInput
						style={styles.input}
						placeholder="Recherche ville"
						placeholderTextColor="#D6E2E3"
						defaultValue={store.ville}
						onChangeText={(text) => store.ville = text}
						onEndEditing={() => {
							fetch(api_url + store.ville)
								.then((response) => response.json())
								.then((json) => {
									console.log(api_url + store.ville)
									store.mapView.animateToRegion({
										...store.region,
										latitude: json["data"][0].latitude,
										longitude: json["data"][0].longitude,
									}, 2000)})
						}}
						underlineColorAndroid="transparent"
					/>
					<Icon style={styles.searchIcon} name="ios-search" size={20} color="#000" onPress={() => {
						fetch(api_url + store.ville)

							.then((response) => response.json())
							.then((json) => {
								console.log(api_url + store.ville)
								store.mapView.animateToRegion({
									...store.region,
									latitude: json["data"][0].latitude,
									longitude: json["data"][0].longitude,
								}, 2000)})
					}}/>
				</View>
				<View style={styles.filtreSection}>
					<IconFA style={styles.filterIcon} name="filter" size={15} color="#000"/>
					<Text style={styles.filtre}>Filtrer</Text>
				</View>
				<View style={styles.map_container}>
					<MapView
						ref={(ref)=>store.mapView=ref}
						style={styles.map}
						initialRegion={store.region}
						region={store.region}
					/>
				</View>
				<View style={styles.promo_view}>
					<View style={styles.promo_container}>
						<View style={styles.lieu}>
							<Marker width={40} height={50} />
							<View>
								<Text style={styles.address_nom}>Chez Polette</Text>
								<Text style={styles.address}>2 rue du Terre Plein, 75002</Text>
								<Text style={styles.address_reduc}>
									<Image style={styles.address_soldes} source={ Soldes }/>10% de réduction sur un menu</Text>
							</View>
						</View>
						<View style={styles.lieu}>
							<Marker width={40} height={50} />
							<View>
								<Text style={styles.address_nom}>Burger Party</Text>
								<Text style={styles.address}>67 avenue des  Grands Boulevards, 75002</Text>
								<Text style={styles.address_reduc}>
									<Image style={styles.address_soldes} source={ Soldes }/>5% de réduction sur votre addition</Text>
							</View>
						</View>
						<View style={styles.lieu}>
							<Marker width={40} height={50} />
							<View>
								<Text style={styles.address_nom}>Pizz’</Text>
								<Text style={styles.address}>684 rue de la Chance, 75002</Text>
								<Text style={styles.address_reduc}>
									<Image style={styles.address_soldes} source={ Soldes }/>10% de réduction pour 2 pizzas achetées</Text>
							</View>
						</View>
					</View>
				</View>
			</View>
		</View>
	);
}

function TousVaccines() {
	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
				gestureEnabled: true,
			}}
			>
			<Stack.Screen name="passeport_vaccinal_scanner" component={passeport_vaccinal_scanner}/>
			<Stack.Screen name="qr_scanner" component={qr_scanner}/>
			<Stack.Screen name="passeport_vaccinal" component={passeport_vaccinal}/>
			<Stack.Screen name="TousDehors" component={tous_dehors}/>
			<Stack.Screen name="TousDehorsMap" component={tous_dehors_map}/>
	</Stack.Navigator>
	)
}

export default class App extends React.Component {
	state = {
		fontsLoaded: false,
		ville: "",
		region: {
			latitude: store.region.latitude,
			longitude: store.region.longitude,
			latitudeDelta: 0.02,
			longitudeDelta: 0.02,
		}
	};

	async _loadFontsAsync() {
		await Font.loadAsync(customFonts);
		this.setState({ fontsLoaded: true });
	}

	componentDidMount() {
		this._loadFontsAsync();
		preventScreenCaptureAsync();
	}

	render() {
		if (this.state.fontsLoaded) {
			return (
				<NavigationContainer>
					<Stack.Navigator
						screenOptions={{
							headerShown: false
						}}
					>
						<Stack.Screen name="TousAntiCovid" component={TousAntiCovid}/>
						<Stack.Screen name="TousVaccines" component={TousVaccines}/>
					</Stack.Navigator>
				</NavigationContainer>
			)
		} else {
			return <AppLoading />;
		}
	};
}

const styles_tous = StyleSheet.create({
	container:{
		flex: 1,
		alignItems: 'center',
		paddingTop: 25,
	},
	passeport_view: {
		position: 'absolute',
		right: 0,
		top: 40,
		margin: 10,
	},
	image: {
		width: '100%',
		height: '100%',
		resizeMode: 'stretch'
	}
});

const is_active = StyleSheet.create({
	button_body: {
		height: '100%',
		borderRadius: 20,
		backgroundColor: 'rgba(250, 250, 250, .56)',
	},
	selector_text: {
		color: '#183152',
		fontFamily: 'Marianne-Bold',
		fontWeight: '700',
		fontSize: 15,
		margin: 15,
	}
})

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		height: vh(100),
		top: 20,
		bottom: 0,
	},
	layerTop: {
		flex: 2,
		backgroundColor: 'rgba(0, 0, 0, .6)'
	},
	layerCenter: {
		flex: 1,
		flexDirection: 'row'
	},
	layerLeft: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, .6)'
	},
	focused: {
		flex: 10
	},
	layerRight: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, .6)'
	},
	layerBottom: {
		flex: 2,
		backgroundColor: 'rgba(0, 0, 0, .6)'
	},
	background: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: '100%',
		zIndex: -1,
	},
	section: {
		backgroundColor: 'rgba(255, 255, 255, .4)',
		borderRadius: 20,
		height: '100%',
		marginTop: 24,
		marginBottom: 48,
		width: vw(90),
		flex: 1,
		display: 'flex',
		alignItems: 'center',
	},
	section_dehors: {
		height: '100%',
		marginTop: 24,
		marginBottom: 48,
		width: vw(90),
		flex: 1,
		display: 'flex',
		alignItems: 'center',
	},
	info: {
		fontFamily: 'Marianne-Bold',
		fontWeight: '700',
		fontSize: 25,
		paddingTop: 28,
		paddingBottom: 28,
		paddingRight: 28,
		paddingLeft: 28,
	},
	data_text: {
		fontFamily: 'Marianne-Bold',
		fontWeight: '700',
		fontSize: 16,
		paddingBottom: 25,
	},
	data_text_qr_template: {
		fontFamily: 'Marianne-Bold',
		fontWeight: '700',
		fontSize: 16,
		textAlign: 'center',
		paddingBottom: 25,
	},
	list: {
		width: '80%',
	},
	qr: {
		paddingTop: 20,
	},
	pdf: {
		bottom: 0,
		right: 0,
		position: 'absolute',
		marginRight: 20,
		marginBottom: 20
	},
	button_body: {
		height: '100%',
		borderTopRightRadius: 20,
		borderBottomRightRadius: 20,
	},
	selector: {
		display: 'flex',
		flexDirection: 'row',
		marginTop: 24,
		borderRadius: 20,
		backgroundColor: 'rgba(54,64,125,0.2)',
		height: vh(6),
	},

	selector_text: {
		fontFamily: 'Marianne-Bold',
		fontWeight: '700',
		color: '#183152',
		fontSize: 15,
		margin: 15,
	},
	chevron: {
		width: '100%',
		top: 0,
		left: 0,
		marginTop: 20,
		marginLeft: 0,
		paddingLeft: 30,
	},
	searchSection: {
		height: 60,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgb(239, 254, 247)',
		borderRadius: 20,
	},
	filtreSection: {
		height: 20,
		paddingTop: 10,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	filtre: {
		fontFamily: 'Marianne-Regular',
		color: 'rgba(24, 49, 82, .46)',
	},
	searchIcon: {
		padding: 15,
	},
	filterIcon: {
		padding: 2,
	},
	input: {
		paddingTop: 10,
		fontFamily: 'Marianne-Regular',
		paddingRight: 20,
		paddingLeft: 20,
		paddingBottom: 10,
		height: 50,
		borderRadius: 20,
		width: '75%',
		backgroundColor: 'rgb(239, 254, 247)',
		color: '#424242',
	},
	info_search: {
		marginTop: 50,
		paddingTop: 20,
		paddingRight: 20,
		paddingLeft: 20,
		paddingBottom: 10,
		borderRadius: 20,
		alignItems: 'center',
		width: '70%',
		backgroundColor: 'rgb(183, 238, 211)',
		shadowColor: "#0FC66E",
		shadowOffset: {
			width: 0,
			height: 0,
		},
		shadowOpacity: 0.25,
		shadowRadius: 10,
		elevation: 10,
	},
	input_text: {
		fontFamily: 'Marianne-Regular',
		color: 'rgb(214, 226, 227)',
	},
	info_text: {
		fontFamily: 'Marianne-Regular',
		textAlign: 'center',
	},
	soldes: {
		marginTop: 10,
		width: 30,
		height: 30
	},
	map: {
		width: '100%',
		height: '100%',

	},
	map_container: {
		marginTop: 20,
		borderRadius: 20,
		borderColor: '#fff',
		borderWidth: 5,
		width: '90%',
		height: '40%',
		overflow: 'hidden',
	},
	promo_view: {
		flex: 1,
		width: '80%',
		marginBottom: 60,
		borderTopRightRadius: 0,
		borderTopLeftRadius: 0,
		borderRadius: 20,
		backgroundColor: 'rgb(183, 238, 211)',
		alignItems: 'center',
	},
	promo_container: {
		paddingTop: 20,
		width: '100%',
		height: '100%',
		alignItems: 'flex-start',
	},
	lieu: {
		flexDirection: 'row',
		marginBottom: 10
	},
	address_nom: {
		fontFamily: 'Marianne-Bold',
	},
	address: {
		fontFamily: 'Marianne-Regular',
		fontSize: 11.2,
	},
	address_reduc: {
		fontFamily: 'Marianne-Regular',
		fontSize: 12,
		letterSpacing: -1,
		color: '#EA1818',
	},
	address_soldes: {
		width: 14,
		height: 14
	}
});
