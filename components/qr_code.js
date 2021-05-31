import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import AppLoading from 'expo-app-loading';
import * as Font from 'expo-font';
import Moment from 'moment';

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

const {vw, vh, vmin, vmax} = require('react-native-expo-viewport-units');
const customFonts = {
  'Marianne-Regular': require('./assets/fonts/Marianne/marianne_medium.otf'),
  'Marianne-Bold': require('./assets/fonts/Marianne/marianne_bold.otf'),
  'Marianne-ExtraBold': require('./assets/fonts/Marianne/marianne_extrabold.otf'),
}

const temp = {
	'nom': 'Ahmed',
	'prenom': 'MOUZOUNE',
	'numero_secu': '1 0101 2300 2012 33',
	'dob': '26/08/2001',
	'vaccination_date': '15/05/2021',
	'expiration_date': create_6_months_after('15/05/2021'),
	'statut': is_valid('15/05/2021'),
}

export default class App extends React.Component {
	state = {
		fontsLoaded: false,
	};

	async _loadFontsAsync() {
		await Font.loadAsync(customFonts);
		this.setState({ fontsLoaded: true });
	}

	componentDidMount() {
		this._loadFontsAsync();
	}

	render() {
		let formatted_text = "NOM : " + temp.nom + "\n";
		formatted_text += "PRENOM : " + temp.prenom + "\n";
		formatted_text += "DATE DE VACCINATION : " + temp.vaccination_date + "\n";
		formatted_text += "DATE D'EXPIRATION : " + temp.expiration_date + "\n";
		formatted_text += "STATUT : " + temp.statut + "";
		if (this.state.fontsLoaded) {
			return (
				<View style={styles.container}>
					<Text style={styles.h1}>MON PASSEPORT</Text>

				<LinearGradient
					// Background Linear Gradient
					colors={['rgba(183,238,211, 1)', 'rgba(40,52,116, 1)']}
					style={styles.background}
				/>
				<View style={styles.section}>
					<View style={styles.qr}>
						<QRCode
							value = {formatted_text}
							size = {vh(28)}
							backgroundColor = 'transparent'
						/>
					</View>
					<Text style={styles.info}>INFORMATIONS</Text>
					<View style={styles.list}>
						<Text style={styles.info_text}>NOM : {temp.nom}</Text>
						<Text style={styles.info_text}>PRENOM : {temp.prenom}</Text>
						<Text style={styles.info_text}>DATE DE NAISSANCE : {temp.dob}</Text>
						<Text style={styles.info_text}>DATE DE VACCINATION : {temp.vaccination_date}</Text>
						<Text style={styles.info_text}>N° DE SÉCU : {temp.numero_secu}</Text>
						<Text style={styles.info_text}>DATE DE D'EXPIRATION : {temp.expiration_date}</Text>
						<Text style={styles.info_text}>STATUT : {temp.statut}</Text>
					</View>
				 </View>

				</View>
				);
    } else {
      return <AppLoading />;
    }
  }
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		heigh: vh(100),
	},
	background: {
		position: 'absolute',
		left: 0,
		right: 0,
		top: 0,
		height: '100%',
		zIndex: -1,
		elevation: -1,
	},
	h1: {
		fontFamily: 'Marianne-Bold',
		fontWeight: '700',
		color: '#183152',
		fontSize: 35,
		marginTop: 48,
	},
	section: {
		backgroundColor: 'rgba(255, 255, 255, .4)',
		borderRadius: 20,
		height: '100%',
		marginTop: 48,
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
	info_text: {
		fontFamily: 'Marianne-Bold',
		fontWeight: '700',
		fontSize: 16,
		paddingBottom: 25,

	},
	list: {
		width: '80%',
	},
	qr: {
		paddingTop: 20,
	}
});
