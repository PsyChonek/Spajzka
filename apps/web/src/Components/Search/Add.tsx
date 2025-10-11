import React, { useEffect, useState } from "react";
import PopUpWindow, { PopUpWindowState } from "../PopUpWindow";
import Input from "../Input";
import { ItemModel } from "../../Api";
import { SearchStyle } from "./Search";
import AddButton_Spajz from "./Spajz/AddButton_Spajz";
import AddButton_Buylist from "./Buylist/AddButton_Buylist";
import notificator from "../../Other/notificator";
import { SaveUserItem } from "../../Other/itemService";

function Add(props: { type: SearchStyle; callbackUpdate: any; query: string }) {
	const [popUpState, setPopUpState] = useState(PopUpWindowState.Hidden);
	const [value, setValue] = useState("");

	useEffect(() => {
		if (popUpState == PopUpWindowState.Accept && (value != "" || props.query != "")) {
			setPopUpState(PopUpWindowState.Hidden);
			SaveNewItem();
		}
	}, [popUpState]);

	const SaveNewItem = (isOnBuylist: boolean = false) => {
		let newItem: ItemModel = {
			name: value == "" ? props.query : value,
			price: 0,
			id: "",
			amount: 0,
			isOnBuylist: isOnBuylist,
			groupId: "",
			userId: "",
		};

		SaveUserItem(newItem);

		// Wait for the item to be saved
		setTimeout(() => {
			props.callbackUpdate();
		}, 100);

		notificator.notify(`Položka ${newItem.name} byla přidána do špajzky.`);
	};

	const Type = () => {
		switch (props.type) {
			case SearchStyle.Spajz:
				return AddButton_Spajz(popUpState, setPopUpState, setValue, props.query);
			case SearchStyle.Buylist:
				return AddButton_Buylist(SaveNewItem, props.query);
		}
	};

	return <div style={{ paddingTop: 20 }}>{Type()}</div>;
}

export default Add;
