-- Add 'wheel_rotation' to session_events event_type check constraint
alter table session_events drop constraint if exists session_events_event_type_check;
alter table session_events add constraint session_events_event_type_check
  check (event_type in (
    'cursor','chart_mode','visible_planets','visible_aspects',
    'tab_switch','theme_change','transit_toggle','transit_date',
    'progressed','relocated','zoom_pan','asteroid_group',
    'show_houses','show_degrees','solar_arc','galactic_toggle',
    'wheel_rotation','state_snapshot','custom'
  ));
