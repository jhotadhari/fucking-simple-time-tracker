import classnames from "classnames";
import dayjs from "dayjs";
import { useState, useContext, Fragment } from "react";
import Context from '../Context';
import { TimeSlot } from "./TimeSlot";
import {
	sortTimeSlotsCompare,
	formatSeconds,
} from "../utils";
const { api } = window;

const GroupInput = ( {
	field,
	timeSlot,
	updateTimeSlots,
	editTimeSlot,
	setEditTimeSlot,
  } ) => {
	const isDirty = undefined !== editTimeSlot[field] && editTimeSlot[field] !== timeSlot[field];

	return <input
		onKeyDown={ e => {
			if ( isDirty ) {
				switch( e.key ) {
					case 'Enter':
						updateTimeSlots( {
							// includeFields: [field],	// ??? TODO Bug: other dirty fields loose their changes.
						} );
						break;
					case 'Escape':
						const newEditTimeSlot = {...editTimeSlot}
						delete newEditTimeSlot[field];
						setEditTimeSlot(newEditTimeSlot );
						break;
				}
			}
		} }
		className={ classnames( {
			'form-control': true,
			'dirty': isDirty,
		} ) }
		type="text"
		onChange={ ( e ) => {
		  	setEditTimeSlot( { ...editTimeSlot, [field]: e.target.value } );
		} }
		value={ undefined !== editTimeSlot[field] ? editTimeSlot[field] : timeSlot[field] }
	/>;
};

const GroupDuration = ( {
	timeSlotsSlice,
  } ) => {
	const seconds = [...timeSlotsSlice].reduce( ( acc, timeSlot ) => {
		const start = timeSlot.dateStart;
		const stop = timeSlot.dateStop ? timeSlot.dateStop : dayjs();
		return start && stop
			? acc + dayjs( stop ).diff( dayjs( start ), 'second' )
			: acc;
	}, 0 );

	return <div
	  className={ classnames( {
		"timeSlot--duration": true,
		"text-end": true,
		'align-middle': true,
		'bg-transparent': true,
		'col-3': true,
	  } ) }
	>
	  <span
		className={ classnames( {
		  invalid: seconds < 0,
		  'p-2': true,
		} ) }
	  >
		{ false !== seconds
		  ? formatSeconds( seconds )
		  : '- m' }
	  </span>
	</div>;
  };

const GroupHeader = ( {
	timeSlotsSlice,
	expanded,
	setExpanded,
} ) => {

	const {
		setTimeSlots,
		timeSlots,
	} = useContext( Context );

	const [editTimeSlot, setEditTimeSlot] = useState( {} );

	const updateTimeSlots = ( { includeFields } ) => {
		let newTimeSlots = [...timeSlots];
		return [...timeSlotsSlice].reduce( ( accumulatorPromise, timeSlot, index ) => {
			return accumulatorPromise.then( () => {
				return new Promise( ( resolve, reject ) => {
					let newEditTimeSlot = {};
					let newTimeSlot = {...timeSlot};
					if ( includeFields ) {
						Object.keys( editTimeSlot ).map( key => {
						if ( includeFields.includes( key ) ) {
							newTimeSlot[key] = editTimeSlot[key];
						} else {
							newEditTimeSlot[key] = editTimeSlot[key];
						}
						} );
					} else {
						newTimeSlot = {
						...newTimeSlot,
						...editTimeSlot,
						};
					}
					api.timeSlots.update( newTimeSlot ).then( numberUpdated => {
						if ( numberUpdated ) {
							const idx = newTimeSlots.findIndex( ts => ts._id === newTimeSlot._id );
							newTimeSlots.splice( idx, 1, newTimeSlot );
							if ( timeSlotsSlice.length === index + 1 ) {
								setTimeSlots( newTimeSlots );
								setEditTimeSlot( newEditTimeSlot );
							}
						}
						resolve( true );
					} );
				} );
			} ).catch( err => console.log( err ) );
		}, Promise.resolve() );
	};

	return <div className="row">
		<div className="col-1" >
			 <button
				className="btn border-0"
				onClick={ () => setExpanded( ! expanded ) }
			>
				{ expanded ? '-' : '+' }
			</button>
		</div>

		{ <>
			{ [
				'title',
				'project',
				'client',
			].map( key => {
				return <div
				key={ key }
				className={ classnames( [
					'timeSlot--' + key,
					'title' === key ? 'col-9' : 'col-4'
				] ) }
			><GroupInput
				field={ key }
				timeSlot={ timeSlotsSlice[0] }
				updateTimeSlots={ updateTimeSlots }
				editTimeSlot={ editTimeSlot }
				setEditTimeSlot={ setEditTimeSlot }
			/></div>;
			} ) }

			<div className="col-4"></div>
			<div className="col-4"></div>
			<GroupDuration
				timeSlotsSlice={ timeSlotsSlice }
			/>

			<div className={ "col-4 timeSlot--actions d-flex" }>
				<button
					className="btn me-2 save"
					onClick={ updateTimeSlots }
					disabled={ ! Object.keys( editTimeSlot ).length }
				>
					save
				</button>
			</div>

		</> }
	</div>;
};

const DateGroup = ( {
	timeSlotsSlice,
} ) => {
	const {
		timeSlotSchema,
	} = useContext( Context );

	const [expanded, setExpanded] = useState( true );

	return <>
		{ timeSlotsSlice.length > 1 && <GroupHeader
			expanded={ expanded }
			setExpanded={ setExpanded }
			timeSlotsSlice={ timeSlotsSlice }
		/> }
		{ expanded && [...timeSlotsSlice].map( ( timeSlot, index ) => (
			<TimeSlot
				key={ timeSlot._id }
				timeSlot={ timeSlot }
			/>
		) ) }

		<div className="row spacer">
			<div className='col'></div>
		</div>
	</>;
};

export const TimeSlotsTable = () => {

	const {
		timeSlots,
	} = useContext( Context );

	const timeSlotsGrouped = {};
	[...timeSlots].map( ( timeSlot ) => {
		let groupDateId = /[0-9]{4}-[0-9]{2}-[0-9]{2}/.exec( dayjs( timeSlot.dateStart ).format('YYYY-MM-DD HH:mm:ss') );
		if ( ! groupDateId || ! groupDateId.length ) {
			return;
		}
		groupDateId = groupDateId[0];
		if ( ! timeSlotsGrouped[groupDateId] ) {
			timeSlotsGrouped[groupDateId] = {};
		}
		const groupId = [
			'title',
			'project',
			'client',
		].map( key => timeSlot[key] ).join( '#####' );
		if ( timeSlotsGrouped[groupDateId][groupId] ) {
			timeSlotsGrouped[groupDateId][groupId] = [
				...timeSlotsGrouped[groupDateId][groupId],
				timeSlot,
			];
		} else {
			timeSlotsGrouped[groupDateId][groupId] = [
				timeSlot,
			];
		}
	} );

	Object.keys( timeSlotsGrouped ).map( groupDateId => {
		Object.keys( timeSlotsGrouped[groupDateId] ).map( groupId => {
			timeSlotsGrouped[groupDateId][groupId].sort( sortTimeSlotsCompare );
		} );
	} );

  	return <div className='container-fluid py-4' >
		<div className="py-4 timeSlots-table" >
			{ Object.keys( timeSlotsGrouped ).map( groupDateId => <Fragment key={ groupDateId } >
				<div className="row">
					<div className="col" >
						{ dayjs( groupDateId ).format( 'dddd DD. MMMM YYYY' ) }
					</div>
				</div>
				{ Object.keys( timeSlotsGrouped[groupDateId] ).map( groupId => <DateGroup
					key={ groupId }
					timeSlotsSlice={ timeSlotsGrouped[groupDateId][groupId] }
				/> ) }
			</Fragment> ) }
		</div>
	</div> ;
};
