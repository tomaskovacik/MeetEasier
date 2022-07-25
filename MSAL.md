
aiad.portal.azure.com -> app registration -> New registration -> whatever name ->  single tenant ->  no redirect url -> register

Authentication -> add platorm -> web -> redirect: http://localhost:8888/redirect (do we need this? ....)

app registration -> click on newly created app -> certificates & secrets -> New client secret -> whatever decription, expires -> what ever you like :) -> add


API permitions-> add permission ->  microsoft graph -> 

Calendars.Read
	
Calendars.Read.Shared
	
Calendars.ReadWrite
	
Place.Read.All
	
Place.ReadWrite.All
	
User.Read.All
	
User.ReadBasic.All

for next dev step -> add booking on site, write permission somewhere will be needed


t.	
