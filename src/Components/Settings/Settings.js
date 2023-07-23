import classnames from "classnames";
import Icon from "../Icon";
import ThemeControl from "./ThemeControl";
import HideFieldsControl from "./HideFieldsControl";
import DbPathControl from "./DbPathControl";
import TimezonesControl from "./TimezonesControl";

const Settings = ( {
	showSettings,
	setShowSettings,
} ) => {

	return showSettings ? <div
		className={ classnames( [
			'modal',
			'fade',
			'modal-xl',
			'd-block',
			'bg-black',
			'bg-opacity-50',
			'bg-blur',
			showSettings ? 'show' : ''
		] ) }
		tabindex="-1"
	>
		<div className="modal-dialog">
			<div className="modal-content">
				<div className="modal-header">
					<h5 className="modal-title">Preferences</h5>
					<button
						type="button"
						className="btn-close"
						aria-label="Close Preferences"
						title="Close Preferences"
						onClick={ () => setShowSettings( false ) }
					></button>
				</div>
				<div className="modal-body">

					<ThemeControl className="mb-5"/>
					<HideFieldsControl className="mb-5"/>
					<DbPathControl className="mb-5"/>
					<TimezonesControl className="mb-5"/>


				</div>
			</div>
		</div>
	</div> : null;

}

export default Settings;
