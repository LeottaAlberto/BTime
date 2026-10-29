# 1. Fase di Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["BTime.Api.csproj", "./"]
RUN dotnet restore "BTime.Api.csproj"
COPY . .
RUN dotnet publish "BTime.Api.csproj" -c Release -o /app/publish

# 2. Fase di Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5008
ENV ASPNETCORE_URLS=http://+:5008
ENTRYPOINT ["dotnet", "BTime.Api.dll"]